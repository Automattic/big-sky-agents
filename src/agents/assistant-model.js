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
	 * see: https://platform.openai.com/docs/api-reference/threads/createThread
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
	 * @param {*}      request
	 * @param {string} request.threadId
	 * @param {string} request.assistantId
	 * @param {string} request.model
	 * @param {string} request.instructions
	 * @param {string} request.additionalInstructions
	 * @param {Array}  request.additionalMessages
	 * @param {Array}  request.tools
	 * @param {Array}  request.metadata
	 * @param {number} request.temperature
	 * @param {number} request.maxPromptTokens
	 * @param {number} request.maxCompletionTokens
	 * @param {Object} request.truncationStrategy
	 * @param {Object} request.responseFormat
	 * @return {Promise<Object>} The response object
	 */
	async createThreadRun( request ) {
		const params = {
			assistant_id: request.assistantId,
			instructions: request.instructions,
			additional_instructions: request.additionalInstructions,
			additional_messages: request.additionalMessages,
			tools: request.tools,
			model: request.model ?? this.getDefaultModel(),
			temperature: request.temperature ?? this.getDefaultTemperature(),
			max_completion_tokens:
				request.maxCompletionTokens ?? this.getDefaultMaxTokens(),
			truncation_strategy: request.truncationStrategy,
			response_format: request.responseFormat,
		};
		// console.warn( 'createThreadRun', params );
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

	async getThreadRuns( threadId ) {
		const headers = this.getHeaders();
		const getRunsRequest = await fetch(
			`${ this.getServiceUrl() }/threads/${ threadId }/runs`,
			{
				method: 'GET',
				headers,
			}
		);
		return await this.getResponse( getRunsRequest, 'list' );
	}

	async getThreadRun( threadId, runId ) {
		const headers = this.getHeaders();
		const getRunRequest = await fetch(
			`${ this.getServiceUrl() }/threads/${ threadId }/runs/${ runId }`,
			{
				method: 'GET',
				headers,
			}
		);
		return await this.getResponse( getRunRequest, 'thread.run' );
	}

	async getThreadMessages( threadId ) {
		const headers = this.getHeaders();
		const getMessagesRequest = await fetch(
			`${ this.getServiceUrl() }/threads/${ threadId }/messages`,
			{
				method: 'GET',
				headers,
			}
		);
		return await this.getResponse( getMessagesRequest, 'list' );
	}

	async submitToolOutputs( threadId, runId, toolCallId, output ) {
		const headers = this.getHeaders();
		const submitToolOutputsRequest = await fetch(
			`${ this.getServiceUrl() }/threads/${ threadId }/runs/${ runId }/submit_tool_outputs`,
			{
				method: 'POST',
				headers,
				body: JSON.stringify( {
					tool_outputs: [
						{
							tool_call_id: toolCallId,
							output,
						},
					],
				} ),
			}
		);
		return await this.getResponse( submitToolOutputsRequest, 'thread.run' );
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

	static getInstance( service, apiKey, feature, sessionId ) {
		switch ( service ) {
			case AssistantModelService.OPENAI:
				return new OpenAIAssistantModel( {
					apiKey,
					feature,
					sessionId,
				} );
			case AssistantModelService.WPCOM_OPENAI:
				return new WPCOMOpenAIAssistantModel( {
					apiKey,
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
