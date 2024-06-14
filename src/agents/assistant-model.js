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
	constructor( { apiKey, assistantId } ) {
		this.apiKey = apiKey;
		this.assistantId = assistantId;
	}

	getApiKey() {
		return this.apiKey;
	}

	/**
	 * https://api.openai.com/v1/threads
	 * @see: https://platform.openai.com/docs/api-reference/threads/createThread
	 * @param {Object} request
	 */
	async createThread( request ) {
		const params = {};
		const headers = this.getHeaders( request );
		const createThreadRequest = await fetch(
			`${ this.getServiceUrl() }/threads`,
			{
				method: 'POST',
				headers,
				body: JSON.stringify( params ),
			}
		);

		if ( createThreadRequest.status === 401 ) {
			throw new Error( 'Unauthorized' );
		} else if ( createThreadRequest.status === 429 ) {
			throw new Error( 'Rate limit exceeded' );
		} else if ( createThreadRequest.status === 500 ) {
			const responseText = await createThreadRequest.text();
			throw new Error( `Internal server error: ${ responseText }` );
		}

		let response;

		try {
			response = await createThreadRequest.json();
		} catch ( error ) {
			console.error( 'Error parsing response', error );
			throw new Error( 'Unexpected response format' );
		}

		console.warn( 'createThreadRequest response', response );

		// if response.code is set and response.choices is not, assume it's an error
		if ( response.code && ! response.id ) {
			throw new Error( `${ response.code } ${ response.message ?? '' }` );
		}

		if ( response.error ) {
			console.error( 'Chat Model Error', response.error, params );
			throw new Error(
				`${ response.error.type }: ${ response.error.message }`
			);
		}

		if ( ! response.object || response.object !== 'thread' ) {
			console.error(
				'Invalid response from server, not a thread',
				response
			);
			throw new Error( 'Invalid response from server' );
		}

		return response;
	}

	/**
	 *
	 * @param {*}      request
	 * @param {string} request.name
	 * @param {string} request.description
	 * @param {string} request.instructions
	 * @param {array}  request.tools
	 * @param {Object} request.tool_resources
	 * @param {Object} request.metadata
	 * @param {Object} request.temperature
	 * @param {Object} request.response_format
	 * @returns
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

		if ( createAssistantRequest.status === 401 ) {
			throw new Error( 'Unauthorized' );
		} else if ( createAssistantRequest.status === 429 ) {
			throw new Error( 'Rate limit exceeded' );
		} else if ( createAssistantRequest.status === 500 ) {
			const responseText = await createAssistantRequest.text();
			throw new Error( `Internal server error: ${ responseText }` );
		}

		let response;

		try {
			response = await createAssistantRequest.json();
		} catch ( error ) {
			console.error( 'Error parsing response', error );
			throw new Error( 'Unexpected response format' );
		}

		console.warn( 'createAssistantRequest response', response );

		// if response.code is set and response.choices is not, assume it's an error
		if ( response.code && ! response.id ) {
			throw new Error( `${ response.code } ${ response.message ?? '' }` );
		}

		if ( response.error ) {
			console.error( 'Chat Model Error', response.error, request );
			throw new Error(
				`${ response.error.type }: ${ response.error.message }`
			);
		}

		if ( ! response.object || response.object !== 'assistant' ) {
			console.error(
				'Invalid response from server, not an assistant',
				response
			);
			throw new Error( 'Invalid response from server' );
		}

		return response;
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
	async runAssistant( request ) {
		const params = {
			assistant_id: request.assistantId,
			instructions: request.instructions,
			additional_instructions: request.additionalInstructions,
			additional_messages: request.additionalMessages,
			tools: request.tools,
			// TODO: etc.
		};
		const headers = this.getHeaders( request );
		const createRunRequest = await fetch(
			`${ this.getServiceUrl() }/threads/${ request.threadId }/runs`,
			{
				method: 'POST',
				headers,
				body: JSON.stringify( params ),
			}
		);

		if ( createRunRequest.status === 401 ) {
			throw new Error( 'Unauthorized' );
		} else if ( createRunRequest.status === 429 ) {
			throw new Error( 'Rate limit exceeded' );
		} else if ( createRunRequest.status === 500 ) {
			const responseText = await createRunRequest.text();
			throw new Error( `Internal server error: ${ responseText }` );
		}

		let response;

		try {
			response = await createRunRequest.json();
		} catch ( error ) {
			console.error( 'Error parsing response', error );
			throw new Error( 'Unexpected response format' );
		}

		console.warn( 'createRunRequest response', response );

		// if response.code is set and response.choices is not, assume it's an error
		if ( response.code && ! response.id ) {
			throw new Error( `${ response.code } ${ response.message ?? '' }` );
		}

		if ( response.error ) {
			console.error( 'Create Run Error', response.error, request );
			throw new Error(
				`${ response.error.type }: ${ response.error.message }`
			);
		}

		if ( ! response.object || response.object !== 'assistant' ) {
			console.error(
				'Invalid response from server, not an assistant',
				response
			);
			throw new Error( 'Invalid response from server' );
		}

		return response;
	}

	// /**
	//  * A higher level call to the chat completions API. This method formats the history, sets defaults,
	//  * calls the API, and returns the assistant response message.
	//  *
	//  * @param {Object}        params                 The parameters for the API call
	//  * @param {string}        params.model           The model to use
	//  * @param {Array<Object>} params.messages        The history of messages (OpenAI Chat Completion format)
	//  * @param {Array<Object>} params.tools           The tools to use (Swagger/JSONSchema format)
	//  * @param {string}        params.systemPrompt    The system prompt
	//  * @param {string}        params.agentLoopPrompt The agent loop prompt
	//  * @param {number}        params.temperature     The temperature to use
	//  * @param {number}        params.maxTokens       The maximum number of tokens to generate
	//  * @param {string}        params.feature         The WPCOM feature slug for this product (WPCOM endpoints only)
	//  * @return {Promise<Object>} The response message
	//  */
	// async run( {
	// 	model,
	// 	messages,
	// 	tools,
	// 	systemPrompt,
	// 	agentLoopPrompt,
	// 	temperature,
	// 	maxTokens,
	// 	feature,
	// } ) {
	// 	if ( ! messages || ! messages.length ) {
	// 		throw new Error( 'Missing history' );
	// 	}

	// 	model = model ?? this.getDefaultModel();
	// 	messages = formatMessages(
	// 		messages,
	// 		systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
	// 		agentLoopPrompt,
	// 		this.maxHistoryLength,
	// 		model
	// 	);
	// 	temperature = temperature ?? this.getDefaultTemperature( model );
	// 	const max_tokens = maxTokens ?? this.getDefaultMaxTokens( model );

	// 	const response = await this.call( {
	// 		model,
	// 		temperature,
	// 		max_tokens,
	// 		messages,
	// 		tools,
	// 		feature,
	// 	} );

	// 	const choice = response.choices[ 0 ];

	// 	if ( choice.finish_reason === 'tool_calls' ) {
	// 	} else if ( choice.finish_reason === 'length' ) {
	// 		throw new Error( 'Finish reason length not implemented' );
	// 	} else if ( choice.finish_reason === 'content_filter' ) {
	// 		throw new Error( 'Finish reason content_filter not implemented' );
	// 	} else if ( choice.finish_reason === 'stop' ) {
	// 	}

	// 	return choice.message;
	// }

	// /**
	//  * A direct Chat Completions call. Simply makes the call and checks for HTTP errors.
	//  * @see https://platform.openai.com/docs/api-reference/chat/create
	//  *
	//  * @param {Object}        request             The request object
	//  * @param {string}        request.model       The model to use
	//  * @param {number}        request.temperature The temperature to use
	//  * @param {number}        request.max_tokens  The maximum number of tokens to generate
	//  * @param {Array<Object>} request.messages    The messages to use
	//  * @param {Array<Object>} request.tools       The tools to use
	//  * @param {string}        request.tool_choice The tool to use
	//  * @param {string}        request.feature     The feature slug for this product (WPCOM endpoints only)
	//  * @param {string}        request.session_id  The session ID (WPCOM endpoints only)
	//  *
	//  * @return {Promise<Object>} The response object
	//  */
	// async call( request ) {
	// 	const params = this.getParams( request );
	// 	const headers = this.getHeaders( request );

	// 	console.log(
	// 		`Calling ${ this.constructor.name } with model ${ params.model }, temperature ${ params.temperature }, max_tokens ${ params.max_tokens }`
	// 	);

	// 	const serviceRequest = await fetch( this.getServiceUrl(), {
	// 		method: 'POST',
	// 		headers,
	// 		body: JSON.stringify( params ),
	// 	} );

	// 	if ( serviceRequest.status === 401 ) {
	// 		throw new Error( 'Unauthorized' );
	// 	} else if ( serviceRequest.status === 429 ) {
	// 		throw new Error( 'Rate limit exceeded' );
	// 	} else if ( serviceRequest.status === 500 ) {
	// 		const responseText = await serviceRequest.text();
	// 		throw new Error( `Internal server error: ${ responseText }` );
	// 	}

	// 	let response;

	// 	try {
	// 		response = await serviceRequest.json();
	// 	} catch ( error ) {
	// 		console.error( 'Error parsing response', error );
	// 		throw new Error( 'Unexpected response format' );
	// 	}

	// 	// if response.code is set and response.choices is not, assume it's an error
	// 	if ( response.code && ! response.choices ) {
	// 		throw new Error( `${ response.code } ${ response.message ?? '' }` );
	// 	}

	// 	if ( response.error ) {
	// 		console.error( 'Chat Model Error', response.error, params );
	// 		throw new Error(
	// 			`${ response.error.type }: ${ response.error.message }`
	// 		);
	// 	}

	// 	if ( ! response?.choices || response?.choices.length > 1 ) {
	// 		console.error(
	// 			'Invalid response from server, unexpected number of choices',
	// 			response,
	// 			response?.choices
	// 		);
	// 		throw new Error( 'Invalid response from server' );
	// 	}

	// 	return response;
	// }

	getParams( {
		model,
		temperature,
		max_tokens,
		messages,
		tools,
		tool_choice = null,
	} ) {
		const params = {
			stream: false,
			model,
			temperature,
			messages,
			max_tokens,
		};

		if ( tools?.length ) {
			params.tools = tools;
		}

		if ( tool_choice ) {
			params.tool_choice = {
				type: 'function',
				function: { name: tool_choice },
			};
		}

		return params;
	}

	getHeaders( /* request */ ) {
		return {
			Authorization: `Bearer ${ this.apiKey }`,
			'Content-Type': 'application/json',
			'OpenAI-Beta': 'assistants=v2',
		};
	}

	getDefaultMaxTokens( /* model */ ) {
		return 4096;
	}

	getDefaultTemperature( /* model */ ) {
		return 0.2;
	}

	getDefaultModel() {
		throw new Error( 'Not implemented' );
	}

	getServiceUrl() {
		throw new Error( 'Not implemented' );
	}

	static getInstance( service, apiToken ) {
		switch ( service ) {
			case AssistantModelService.OPENAI:
				return new OpenAIAssistantModel( { apiKey: apiToken } );
			case AssistantModelService.WPCOM_OPENAI:
				return new WPCOMOpenAIAssistantModel( { apiKey: apiToken } );
			default:
				throw new Error( `Unknown service: ${ service }` );
		}
	}
}

export class WPCOMOpenAIAssistantModel extends AssistantModel {
	getHeaders( { feature, session_id, ...request } ) {
		const headers = super.getHeaders( request );
		if ( feature ) {
			headers[ 'X-WPCOM-AI-Feature' ] = feature;
			headers[ 'Access-Control-Request-Headers' ] =
				'authorization,content-type,X-WPCOM-AI-Feature';
		}

		if ( session_id ) {
			headers[ 'X-WPCOM-Session-ID' ] = session_id;
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
