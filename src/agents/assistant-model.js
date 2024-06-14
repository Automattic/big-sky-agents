// TODO: extract all this to a JSON configuration file
export const AssistantModelService = {
	WPCOM_OPENAI: 'wpcom-openai', // the wpcom OpenAI proxy
	OPENAI: 'openai',
	getAvailable: () => {
		const services = [
			AssistantModelService.WPCOM_OPENAI,
			AssistantModelService.OPENAI,
		];
		return services;
	},
	getDefault: () => {
		return AssistantModelService.OPENAI;
	},
	getDefaultApiKey: ( service ) => {
		if (
			service === AssistantModelService.OPENAI &&
			typeof process !== 'undefined'
		) {
			return process.env.OPENAI_API_KEY;
		}
		return null;
	},
};

export const AssistantModelType = {
	GPT_4_TURBO: 'gpt-4-turbo',
	GPT_4O: 'gpt-4o',
	isMultimodal: ( model ) => model === AssistantModelType.GPT_4O,
	supportsToolMessages: ( model ) =>
		[ AssistantModelType.GPT_4O, AssistantModelType.GPT_4_TURBO ].includes(
			model
		),
	getAvailable: ( /* service */ ) => {
		return [ AssistantModelType.GPT_4_TURBO, AssistantModelType.GPT_4O ];
	},
	getDefault( /* service = null */ ) {
		return AssistantModelType.GPT_4O;
	},
};

// reformat the history based on what the model supports
const formatHistory = ( history, model ) => {
	const maxImageURLLength = 200; // typically they are base64-encoded so very large
	const isMultimodal = AssistantModelType.isMultimodal( model );
	const supportsToolMessages =
		AssistantModelType.supportsToolMessages( model );

	// if it's not multimodal, convert any multipart "content" properties to a simple string containing a list of image URLs.
	if ( ! isMultimodal ) {
		history = history.map( ( message ) => {
			if ( message.content && Array.isArray( message.content ) ) {
				const text = message.content
					.filter( ( content ) => content.type === 'text' )
					.map( ( content ) => content.text )
					.join( '\n' );
				const imageUrls = message.content
					.filter( ( content ) => content.type === 'image_url' )
					.map( ( content ) =>
						content.image_url.substring( 0, maxImageURLLength )
					)
					.join( '\n' );
				message.content = [ text, imageUrls ].join( '\n' );
			}
			return message;
		} );
	}

	if ( ! supportsToolMessages ) {
		console.warn( 'remapping history', history );
		history = history.map( ( message ) => {
			if ( message.role === 'tool' ) {
				return {
					...message,
					role: 'user',
				};
			}
			return message;
		} );
		console.warn( 'remapped history', history );
	}

	return history;
};

const DEFAULT_SYSTEM_PROMPT = 'You are a helpful AI assistant.';

function formatMessages(
	history,
	instructions,
	additionalInstructions,
	maxHistoryLength,
	model
) {
	const trimmedMessages = history.slice( -maxHistoryLength );

	const firstNonToolMessageIndex = trimmedMessages.findIndex(
		( message ) => message.role !== 'tool'
	);

	if ( firstNonToolMessageIndex > 0 ) {
		trimmedMessages.splice( 0, firstNonToolMessageIndex );
	}

	const messages = [
		{
			role: 'system',
			content: instructions,
		},
		...formatHistory( trimmedMessages, model ),
	];

	if ( additionalInstructions ) {
		messages.push( {
			role: 'system',
			content: additionalInstructions,
		} );
	}

	return messages;
}

// class Thread {}

class AssistantModel {
	constructor( { apiKey, assistantId, feature, sessionId } ) {
		this.apiKey = apiKey;
		this.assistantId = assistantId;
		this.feature = feature;
		this.sessionId = sessionId;
	}

	getApiKey() {
		return this.apiKey;
	}

	/**
	 * https://api.openai.com/v1/threads
	 * @see: https://platform.openai.com/docs/api-reference/threads/createThread
	 * @param {Object} request
	 */
	async createThread() {
		const params = {};
		const headers = this.getHeaders();
		const createThreadRequest = await fetch(
			`${ this.getServiceUrl() }/threads`,
			{
				method: 'POST',
				headers,
				body: JSON.stringify( params ),
			}
		);
		return await this.getResponse( createThreadRequest, 'thread' );
	}

	/**
	 * This is not currently used anywhere but kept here for reference.
	 *
	 * @param {*}      request
	 * @param {string} request.name
	 * @param {string} request.description
	 * @param {string} request.instructions
	 * @param {Array}  request.tools
	 * @param {Object} request.tool_resources
	 * @param {Object} request.metadata
	 * @param {Object} request.temperature
	 * @param {Object} request.response_format
	 * @return {Promise<Object>} The response object
	 */
	async createAssistant( request ) {
		const headers = this.getHeaders( request );
		const createAssistantRequest = await fetch(
			`${ this.getServiceUrl() }/assistants`,
			{
				method: 'POST',
				headers,
				body: JSON.stringify( request ),
			}
		);
		return await this.getResponse( createAssistantRequest, 'assistant' );
	}

	/**
	 *
	 * @param {*}       request
	 * @param {string}  request.threadId
	 * @param {string}  request.assistantId
	 * @param {string}  request.model
	 * @param {string}  request.instructions
	 * @param {string}  request.additionalInstructions
	 * @param {array}   request.additionalMessages
	 * @param {array}   request.tools
	 * @param {array}   request.metadata
	 * @param {float}   request.temperature
	 * @param {integer} request.max_prompt_tokens
	 * @param {integer} request.max_completion_tokens
	 * @param {Object}  request.truncation_strategy
	 * @param {Object}  request.response_format
	 * @returns
	 */
	async runThread( request ) {
		const params = {
			assistant_id: request.assistantId,
			instructions: request.instructions,
			additional_instructions: request.additionalInstructions,
			additional_messages: request.additionalMessages,
			tools: request.tools,
			model: request.model ?? this.getDefaultModel(),
			temperature: request.temperature ?? this.getDefaultTemperature(),
			max_completion_tokens:
				request.max_tokens ?? this.getDefaultMaxTokens(),
		};
		const headers = this.getHeaders();
		const createRunRequest = await fetch(
			`${ this.getServiceUrl() }/threads/${ request.threadId }/runs`,
			{
				method: 'POST',
				headers,
				body: JSON.stringify( params ),
			}
		);
		return await this.getResponse( createRunRequest, 'thread.run' );
	}

	async createThreadMessage( threadId, message ) {
		// calls POST threads/:threadId/messages
		const params = message;
		const headers = this.getHeaders();
		const createMessageRequest = await fetch(
			`${ this.getServiceUrl() }/threads/${ threadId }/messages`,
			{
				method: 'POST',
				headers,
				body: JSON.stringify( params ),
			}
		);
		return await this.getResponse( createMessageRequest, 'thread.message' );
	}

	async getResponse( request, expectedObject = null ) {
		if ( request.status === 400 ) {
			const response = await request.json();
			if ( response.error ) {
				throw new Error(
					`${ response.error.type }: ${ response.error.message }`
				);
			}
			throw new Error( 'Bad request' );
		} else if ( request.status === 401 ) {
			throw new Error( 'Unauthorized' );
		} else if ( request.status === 429 ) {
			throw new Error( 'Rate limit exceeded' );
		} else if ( request.status === 500 ) {
			const response = await request.json();
			throw new Error( `Internal server error: ${ response }` );
		}

		const response = await request.json();

		if ( response.code && ! response.id ) {
			throw new Error( `${ response.code } ${ response.message ?? '' }` );
		}

		if ( expectedObject && response.object !== expectedObject ) {
			console.error(
				`Invalid response from server, not a ${ expectedObject }`,
				response
			);
			throw new Error( 'Invalid response from server' );
		}

		return response;
	}

	getHeaders() {
		return {
			Authorization: `Bearer ${ this.apiKey }`,
			'Content-Type': 'application/json',
			'OpenAI-Beta': 'assistants=v2',
		};
	}

	getDefaultMaxTokens() {
		return 4096;
	}

	getDefaultTemperature() {
		return 0.2;
	}

	getDefaultModel() {
		throw new Error( 'Not implemented' );
	}

	getServiceUrl() {
		throw new Error( 'Not implemented' );
	}

	static getInstance( service, apiToken, feature, sessionId ) {
		switch ( service ) {
			case AssistantModelService.OPENAI:
				return new OpenAIAssistantModel( {
					apiKey: apiToken,
					feature,
					sessionId,
				} );
			case AssistantModelService.WPCOM_OPENAI:
				return new WPCOMOpenAIAssistantModel( {
					apiKey: apiToken,
					feature,
					sessionId,
				} );
			default:
				throw new Error( `Unknown service: ${ service }` );
		}
	}
}

export class WPCOMOpenAIAssistantModel extends AssistantModel {
	getHeaders() {
		const headers = super.getHeaders();
		if ( this.feature ) {
			headers[ 'X-WPCOM-AI-Feature' ] = this.feature;
			headers[ 'Access-Control-Request-Headers' ] =
				'authorization,content-type,X-WPCOM-AI-Feature';
		}

		if ( this.sessionId ) {
			headers[ 'X-WPCOM-Session-ID' ] = this.sessionId;
		}

		return headers;
	}

	getDefaultModel() {
		return AssistantModelType.GPT_4O;
	}

	getServiceUrl() {
		return 'https://public-api.wordpress.com/wpcom/v2/big-sky/assistant';
	}
}

export class OpenAIAssistantModel extends AssistantModel {
	getDefaultModel() {
		return AssistantModelType.GPT_4O;
	}

	getServiceUrl() {
		return 'https://api.openai.com/v1/';
	}
}

export default AssistantModel;
