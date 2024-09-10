/**
 * Internal dependencies
 */
import log from '../utils/log-debug.js';
import { EventSourceParserStream } from 'eventsource-parser/stream';

function onParse( event ) {
	if ( event.type === 'event' ) {
		console.log( 'Received event!' );
		console.log( 'id: %s', event.id || '<none>' );
		console.log( 'name: %s', event.name || '<none>' );
		console.log( 'data: %s', event.data );
	} else if ( event.type === 'reconnect-interval' ) {
		console.log(
			'We should set reconnect interval to %d milliseconds',
			event.value
		);
	}
}

// TODO: extract all this to a JSON configuration file
export const ChatModelService = {
	WPCOM_JETPACK_AI: 'wpcom-jetpack-ai',
	WPCOM_OPENAI: 'wpcom-openai', // the wpcom OpenAI proxy
	OPENAI: 'openai',
	GROQ: 'groq',
	OLLAMA: 'ollama',
	LMSTUDIO: 'lmstudio',
	LOCALAI: 'localai',
	LOCAL_GRAPH: 'local-graph',
	WPCOM_GRAPH: 'wpcom-graph',
	getAvailable: () => {
		const services = [
			ChatModelService.WPCOM_JETPACK_AI,
			ChatModelService.WPCOM_OPENAI,
			ChatModelService.OLLAMA,
			ChatModelService.LMSTUDIO,
			ChatModelService.LOCALAI,
			ChatModelService.OPENAI,
			ChatModelService.GROQ,
			ChatModelService.LOCAL_GRAPH,
			ChatModelService.WPCOM_GRAPH,
		];
		return services;
	},
	getDefault: () => {
		return ChatModelService.OPENAI;
	},
	getDefaultApiKey: ( service ) => {
		if (
			service === ChatModelService.GROQ &&
			typeof process !== 'undefined'
		) {
			return process.env.GROQ_API_KEY;
		} else if (
			service === ChatModelService.OPENAI &&
			typeof process !== 'undefined'
		) {
			return process.env.OPENAI_API_KEY;
		}
		return null;
	},
};

export const ChatModelType = {
	GPT_4O_MINI: 'gpt-4o-mini',
	GPT_4_TURBO: 'gpt-4-turbo',
	GPT_4O: 'gpt-4o',
	LLAMA3_70B_8192: 'llama3-70b-8192',
	LLAMA3_70B_8192_WPCOM: 'llama3-70b',
	GEMMA_7b_INSTRUCT: 'gemma:7b-instruct-q5_K_M',
	PHI_3_MEDIUM: 'legraphista/Phi-3-medium-128k-instruct-IMat-GGUF',
	MISTRAL_03: 'mistral-0.3',
	HERMES_2_PRO_MISTRAL: 'hermes-2-pro-mistral',
	isMultimodal: ( model ) => model === ChatModelType.GPT_4O,
	supportsToolMessages: ( model ) =>
		[
			ChatModelType.GPT_4O,
			ChatModelType.GPT_4_TURBO,
			ChatModelType.GPT_4O_MINI,
			ChatModelType.LLAMA3_70B_8192,
			ChatModelType.MISTRAL_03,
			ChatModelType.HERMES_2_PRO_MISTRAL,
			ChatModelType.LOCAL_GRAPH,
			ChatModelType.WPCOM_GRAPH,
		].includes( model ),
	getAvailable: ( service ) => {
		if ( service === ChatModelService.GROQ ) {
			return [ ChatModelType.LLAMA3_70B_8192 ];
		} else if (
			[
				ChatModelService.WPCOM_JETPACK_AI,
				ChatModelService.WPCOM_OPENAI,
			].includes( service )
		) {
			return [
				ChatModelType.GPT_4O,
				ChatModelType.GPT_4_TURBO,
				ChatModelType.GPT_4O_MINI,
				ChatModelType.LLAMA3_70B_8192_WPCOM,
			];
		} else if ( service === ChatModelService.OLLAMA ) {
			// TODO: obtain dynamically
			return [ ChatModelType.GEMMA_7b_INSTRUCT ];
		} else if ( service === ChatModelService.LOCALAI ) {
			// TODO: obtain dynamically
			return [
				ChatModelType.MISTRAL_03,
				ChatModelType.HERMES_2_PRO_MISTRAL,
			];
		} else if ( service === ChatModelService.LMSTUDIO ) {
			return [ ChatModelType.PHI_3_MEDIUM ];
		}
		return [
			ChatModelType.GPT_4O_MINI,
			ChatModelType.GPT_4_TURBO,
			ChatModelType.GPT_4O,
		];
	},
	getDefault( service = null ) {
		if ( ! service ) {
			service = ChatModelService.getDefault();
		}
		if ( service === ChatModelService.GROQ ) {
			return ChatModelType.LLAMA3_70B_8192;
		} else if (
			[
				ChatModelService.WPCOM_JETPACK_AI,
				ChatModelService.WPCOM_OPENAI,
				ChatModelService.OPENAI,
			].includes( service )
		) {
			return ChatModelType.GPT_4O;
		} else if ( service === ChatModelService.OLLAMA ) {
			return ChatModelType.GEMMA_7b_INSTRUCT;
		} else if ( service === ChatModelService.LOCALAI ) {
			return ChatModelType.HERMES_2_PRO_MISTRAL;
		}
		return ChatModelType.GPT_4O;
	},
};

// reformat the message history based on what the model supports
const formatMessagesForModel = ( messages, model ) => {
	const maxImageURLLength = 200; // typically they are base64-encoded so very large
	const isMultimodal = ChatModelType.isMultimodal( model );
	const supportsToolMessages = ChatModelType.supportsToolMessages( model );

	// if it's not multimodal, convert any multipart "content" properties to a simple string containing a list of image URLs.
	if ( ! isMultimodal ) {
		messages = messages.map( ( message ) => {
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
		console.warn( 'remapping history', messages );
		messages = messages.map( ( message ) => {
			if ( message.role === 'tool' ) {
				return {
					...message,
					role: 'user',
				};
			}
			return message;
		} );
		console.warn( 'remapped history', messages );
	}

	// JSON-serialize any tool call arguments in messages[X].tool_calls[Y].function.arguments
	messages = messages.map( ( message ) => {
		if ( message.tool_calls ) {
			return {
				...message,
				tool_calls: message.tool_calls.map( ( tool_call ) => {
					if ( typeof tool_call.function.arguments !== 'string' ) {
						tool_call.function.arguments = JSON.stringify(
							tool_call.function.arguments
						);
					}
					return tool_call;
				} ),
			};
		}
		return message;
	} );

	return messages;
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
		...formatMessagesForModel( trimmedMessages, model ),
	];

	if ( additionalInstructions ) {
		messages.push( {
			role: 'system',
			content: additionalInstructions,
		} );
	}

	return messages;
}

class ChatModel {
	constructor( { apiKey, feature, sessionId } ) {
		this.apiKey = apiKey;
		this.feature = feature;
		this.sessionId = sessionId;
		this.abortController = null;
		this.streamSeparator = '\n\n';
	}

	getApiKey() {
		return this.apiKey;
	}

	/**
	 * A higher level call to the chat completions API. This method formats the history, sets defaults,
	 * calls the API, and returns the assistant response message.
	 *
	 * @param {Object}        params                        The parameters for the API call
	 * @param {string}        params.model                  The model to use
	 * @param {Array<Object>} params.messages               The history of messages (OpenAI Chat Completion format)
	 * @param {Array<Object>} params.tools                  The tools to use (Swagger/JSONSchema format)
	 * @param {string}        params.instructions           The system prompt
	 * @param {string}        params.additionalInstructions The agent loop prompt
	 * @param {number}        params.temperature            The temperature to use
	 * @param {number}        params.maxTokens              The maximum number of tokens to generate
	 * @param {Array<string>} params.tags                   The tags to use for analytics
	 * @param {Function}      params.middleware             The middleware to use
	 * @return {Promise<Object>} The response message
	 */
	async run( {
		model,
		messages,
		tools,
		instructions,
		additionalInstructions,
		temperature,
		maxTokens,
		tags,
		middleware,
	} ) {
		if ( ! messages || ! messages.length ) {
			throw new Error( 'Missing history' );
		}

		model = model ?? this.getDefaultModel();
		messages = formatMessages(
			messages,
			instructions ?? DEFAULT_SYSTEM_PROMPT,
			additionalInstructions,
			this.maxHistoryLength,
			model
		);
		temperature = temperature ?? this.getDefaultTemperature( model );
		const max_tokens = maxTokens ?? this.getDefaultMaxTokens( model );

		const invokeChatModel = middleware
			? middleware( this.call.bind( this ), {
					tags,
			  } )
			: this.call.bind( this );

		const response = await invokeChatModel( {
			model,
			temperature,
			max_tokens,
			messages,
			tools,
		} );

		const choice = response.choices[ 0 ];

		if ( choice.finish_reason === 'tool_calls' ) {
		} else if ( choice.finish_reason === 'length' ) {
			throw new Error( 'Finish reason length not implemented' );
		} else if ( choice.finish_reason === 'content_filter' ) {
			throw new Error( 'Finish reason content_filter not implemented' );
		} else if ( choice.finish_reason === 'stop' ) {
		}

		return choice.message;
	}

	/**
	 * A direct Chat Completions call. Simply makes the call and checks for HTTP errors.
	 * @see https://platform.openai.com/docs/api-reference/chat/create
	 *
	 * @param {Object}        request             The request object
	 * @param {string}        request.model       The model to use
	 * @param {number}        request.temperature The temperature to use
	 * @param {number}        request.max_tokens  The maximum number of tokens to generate
	 * @param {Array<Object>} request.messages    The messages to use
	 * @param {Array<Object>} request.tools       The tools to use
	 * @param {string}        request.tool_choice The tool to use
	 * @param {boolean}       request.stream      Whether to stream the response
	 *
	 * @return {Promise<Object>} The response object
	 */
	async call( request ) {
		const params = this.getParams( request );
		const headers = this.getHeaders();
		this.abortController = new AbortController();

		log.info(
			`🤖 Calling ${ this.constructor.name } with model ${ params.model }, temperature ${ params.temperature }, max_tokens ${ params.max_tokens }`
		);

		const serviceRequest = await fetch( this.getServiceUrl(), {
			method: 'POST',
			headers,
			body: JSON.stringify( params ),
			signal: this.abortController.signal,
		} );

		if ( serviceRequest.status === 401 ) {
			throw new Error( 'Unauthorized' );
		} else if ( serviceRequest.status === 403 ) {
			throw new Error( 'Forbidden' );
		} else if ( serviceRequest.status === 429 ) {
			throw new Error( 'Rate limit exceeded' );
		} else if ( serviceRequest.status === 500 ) {
			const responseText = await serviceRequest.text();
			throw new Error( `Internal server error: ${ responseText }` );
		}

		let response;

		try {
			response = await serviceRequest.json();
		} catch ( error ) {
			if ( error.name === 'AbortError' ) {
				return null;
			}
			console.error( 'Error parsing response', error );
			throw new Error( 'Unexpected response format' );
		} finally {
			this.abortController = null;
		}

		// if response.code is set and response.choices is not, assume it's an error
		if ( response.code && ! response.choices ) {
			throw new Error( `${ response.code } ${ response.message ?? '' }` );
		}

		if ( response.error ) {
			console.error( 'Chat Model Error', response.error, params );
			throw new Error(
				`${ response.error.type }: ${ response.error.message }`
			);
		}

		if ( ! response?.choices || response?.choices.length > 1 ) {
			console.error(
				'Invalid response from server, unexpected number of choices',
				response,
				response?.choices
			);
			throw new Error( 'Invalid response from server' );
		}

		return response;
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
	 * @return {*} An async iterable of events
	 */
	async *runStream( {
		model,
		messages,
		tools,
		instructions,
		additionalInstructions,
		temperature,
		maxTokens,
		// graphConfig,
	} ) {
		if ( ! messages || ! messages.length ) {
			throw new Error( 'Missing history' );
		}
		this.abortController = new AbortController();
		const headers = this.getHeaders();
		headers[ 'Content-Type' ] = 'text/event-stream';
		model = model ?? this.getDefaultModel();
		messages = formatMessages(
			messages,
			instructions ?? DEFAULT_SYSTEM_PROMPT,
			additionalInstructions,
			this.maxHistoryLength,
			model
		);
		temperature = temperature ?? this.getDefaultTemperature( model );
		const max_tokens = maxTokens ?? this.getDefaultMaxTokens( model );

		log.info(
			`🤖 Streaming ${ this.constructor.name } with model ${ model }, temperature ${ temperature }, max_tokens ${ max_tokens }`
		);

		const response = await fetch( this.getServiceUrl(), {
			method: 'POST',
			headers,
			body: JSON.stringify( {
				model,
				temperature,
				max_tokens,
				messages,
				tools,
				stream: true,
			} ),
			signal: this.abortController.signal,
		} );

		if ( response.status === 401 ) {
			throw new Error( 'Unauthorized' );
		} else if ( response.status === 403 ) {
			throw new Error( 'Forbidden' );
		} else if ( response.status === 429 ) {
			throw new Error( 'Rate limit exceeded' );
		} else if ( response.status === 500 ) {
			const responseText = await response.text();
			throw new Error( `Internal server error: ${ responseText }` );
		}

		const reader = response.body
			.pipeThrough( new TextDecoderStream() )
			.pipeThrough( new EventSourceParserStream() )
			.getReader();

		try {
			while ( true ) {
				const { done, value } = await reader.read();
				if ( done ) {
					break;
				}

				if ( value.data === '[DONE]' ) {
					yield {
						event: 'done',
					};
					break;
				}

				if ( value.object === 'chat.completion.error' ) {
					yield {
						event: 'chat.completion.error',
						data: JSON.parse( value.data ),
					};
					break;
				}
				yield {
					event: 'chat.message.partial',
					data: JSON.parse( value.data ),
				};
			}
		} catch ( err ) {
			console.error( 'Stream reading error:', err );
		} finally {
			reader.releaseLock();
		}
	}

	abortRequest() {
		if ( this.abortController ) {
			this.abortController.abort();
		}
	}

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

	getHeaders() {
		return {
			Authorization: `Bearer ${ this.apiKey }`,
			'Content-Type': 'application/json',
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

	static getInstance( service, apiKey, feature, sessionId ) {
		const params = { apiKey, feature, sessionId };
		switch ( service ) {
			case ChatModelService.GROQ:
				return new GroqChatModel( params );
			case ChatModelService.OPENAI:
				return new OpenAIChatModel( params );
			case ChatModelService.WPCOM_JETPACK_AI:
				return new WPCOMJetpackAIChatModel( params );
			case ChatModelService.WPCOM_OPENAI:
				return new WPCOMOpenAIChatModel( params );
			case ChatModelService.OLLAMA:
				return new OllamaChatModel( params );
			case ChatModelService.LMSTUDIO:
				return new LMStudioChatModel( params );
			case ChatModelService.LOCALAI:
				return new LocalAIChatModel( params );
			case ChatModelService.LOCAL_GRAPH:
				return new LocalGraphChatModel( params );
			case ChatModelService.WPCOM_GRAPH:
				return new WPCOMGraphChatModel( params );
			default:
				throw new Error( `Unknown service: ${ service }` );
		}
	}
}

export class WPCOMJetpackAIChatModel extends ChatModel {
	getDefaultModel() {
		return ChatModelType.GPT_4O;
	}

	getParams( request ) {
		const params = super.getParams( request );
		if ( this.feature ) {
			params.feature = this.feature;
		}

		if ( this.sessionId ) {
			params.session_id = this.sessionId;
		}

		return params;
	}

	getServiceUrl() {
		return 'https://public-api.wordpress.com/wpcom/v2/jetpack-ai-query';
	}
}

export class WPCOMOpenAIChatModel extends ChatModel {
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
		return ChatModelType.GPT_4O;
	}

	getServiceUrl() {
		return 'https://public-api.wordpress.com/wpcom/v2/openai-proxy/v1/chat/completions';
	}
}

export class OllamaChatModel extends ChatModel {
	getDefaultModel() {
		return ChatModelType.GEMMA_7b_INSTRUCT;
	}

	getServiceUrl() {
		return 'http://localhost:11434/api/chat';
	}
}

export class LMStudioChatModel extends ChatModel {
	getDefaultModel() {
		return ChatModelType.PHI_3_MEDIUM;
	}

	getServiceUrl() {
		return 'http://localhost:1234/v1/chat/completions';
	}
}

export class LocalAIChatModel extends ChatModel {
	getDefaultModel() {
		return ChatModelType.HERMES_2_PRO_MISTRAL;
	}

	getServiceUrl() {
		return 'http://localhost:1234/v1/chat/completions';
	}
}

export class LocalGraphChatModel extends ChatModel {
	constructor( { apiKey, feature, sessionId } ) {
		super( { apiKey, feature, sessionId } );
		this.streamSeparator = '\r\n\r\n';
	}

	getApiKey() {
		return this.apiKey;
	}
	getDefaultModel() {
		return ChatModelType.GPT_4O;
	}

	getServiceUrl() {
		return 'http://localhost:8000/ai-services/graphs/chat/completions';
	}
}

export class WPCOMGraphChatModel extends ChatModel {
	constructor( { apiKey, feature, sessionId } ) {
		super( { apiKey, feature, sessionId } );
		this.streamSeparator = '\r\n\r\n';
	}

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
		return ChatModelType.GPT_4O;
	}

	getServiceUrl() {
		return 'https://public-api.wordpress.com/wpcom/v2/graphs/v1/chat/completions';
	}
}
export class OpenAIChatModel extends ChatModel {
	getDefaultModel() {
		return ChatModelType.GPT_4O;
	}

	getServiceUrl() {
		return 'https://api.openai.com/v1/chat/completions';
	}
}

export class GroqChatModel extends ChatModel {
	getDefaultModel() {
		return ChatModelType.LLAMA3_70B_8192;
	}

	getDefaultTemperature() {
		return 0.1;
	}

	getDefaultMaxTokens() {
		return 8192;
	}

	getServiceUrl() {
		return 'https://api.groq.com/openai/v1/chat/completions';
	}
}

export default ChatModel;
