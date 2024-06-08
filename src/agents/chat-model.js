// TODO: extract all this to a JSON configuration file
export const ChatModelService = {
	WPCOM_JETPACK_AI: 'wpcom-jetpack-ai',
	WPCOM_OPENAI: 'wpcom-openai', // the wpcom OpenAI proxy
	OPENAI: 'openai',
	GROQ: 'groq',
	OLLAMA: 'ollama',
	LMSTUDIO: 'lmstudio',
	LOCALAI: 'localai',
	getAvailable: () => {
		const services = [
			ChatModelService.WPCOM_JETPACK_AI,
			ChatModelService.WPCOM_OPENAI,
			ChatModelService.OLLAMA,
			ChatModelService.LMSTUDIO,
			ChatModelService.LOCALAI,
			ChatModelService.OPENAI,
			ChatModelService.GROQ,
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
	GPT_4_TURBO: 'gpt-4-turbo',
	GPT_4O: 'gpt-4o-2024-05-13',
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
			ChatModelType.LLAMA3_70B_8192,
			ChatModelType.MISTRAL_03,
			ChatModelType.HERMES_2_PRO_MISTRAL,
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
		return [ ChatModelType.GPT_4_TURBO, ChatModelType.GPT_4O ];
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

function getServiceChatCompletionUrl( service ) {
	switch ( service ) {
		case ChatModelService.GROQ:
			return 'https://api.groq.com/openai/v1/chat/completions';
		case ChatModelService.OPENAI:
			return 'https://api.openai.com/v1/chat/completions';
		case ChatModelService.OLLAMA:
			return 'http://127.0.0.1:11434/api/chat';
		case ChatModelService.LMSTUDIO:
			return 'http://127.0.0.1:1234/v1/chat/completions';
		case ChatModelService.LOCALAI:
			return 'http://127.0.0.1:1234/v1/chat/completions';
		case ChatModelService.WPCOM_OPENAI:
			return 'https://public-api.wordpress.com/wpcom/v2/openai-proxy/v1/chat/completions';
		default:
			return 'https://public-api.wordpress.com/wpcom/v2/jetpack-ai-query';
	}
}

// reformat the history based on what the model supports
const formatHistory = ( history, model ) => {
	const maxImageURLLength = 200; // typically they are base64-encoded so very large
	const isMultimodal = ChatModelType.isMultimodal( model );
	const supportsToolMessages = ChatModelType.supportsToolMessages( model );

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

function getDefaultTemperature( service, model ) {
	if (
		service === ChatModelService.GROQ &&
		model === ChatModelService.LLAMA3_70B_8192
	) {
		// arbitrary difference for testing
		return 0.1;
	}
	return 0.2;
}

function getDefaultMaxTokens( service, model ) {
	if (
		service === ChatModelService.GROQ &&
		model === ChatModelService.LLAMA3_70B_8192
	) {
		return 8192;
	}
	return 4096;
}

const DEFAULT_SYSTEM_PROMPT = 'You are a helpful AI assistant.';

function formatMessages(
	history,
	systemPrompt,
	agentLoopPrompt,
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
			content: systemPrompt,
		},
		...formatHistory( trimmedMessages, model ),
	];

	if ( agentLoopPrompt ) {
		messages.push( {
			role: 'system',
			content: agentLoopPrompt,
		} );
	}

	return messages;
}

class ChatModel {
	constructor( { apiKey, service } ) {
		this.service = service ?? ChatModelService.getDefault();
		this.apiKey =
			apiKey ?? ChatModelService.getDefaultApiKey( this.service );
	}

	getDefaultModel() {
		return ChatModelType.getDefault( this.service );
	}

	getApiKey() {
		return this.apiKey;
	}

	getService() {
		return this.service;
	}

	/**
	 * A higher level call to the chat completions API. This method formats the history, sets defaults,
	 * calls the API, and returns the assistant response message.
	 *
	 * @param {Object}        params                 The parameters for the API call
	 * @param {string}        params.model           The model to use
	 * @param {Array<Object>} params.messages        The history of messages (OpenAI Chat Completion format)
	 * @param {Array<Object>} params.tools           The tools to use (Swagger/JSONSchema format)
	 * @param {string}        params.systemPrompt    The system prompt
	 * @param {string}        params.agentLoopPrompt The agent loop prompt
	 * @param {number}        params.temperature     The temperature to use
	 * @param {number}        params.maxTokens       The maximum number of tokens to generate
	 * @param {string}        params.feature         The WPCOM feature slug for this product (WPCOM endpoints only)
	 * @return {Promise<Object>} The response message
	 */
	async run( {
		model,
		messages,
		tools,
		systemPrompt,
		agentLoopPrompt,
		temperature,
		maxTokens,
		feature,
	} ) {
		if ( ! messages || ! messages.length ) {
			throw new Error( 'Missing history' );
		}

		model = model ?? ChatModelType.getDefault( this.service );
		messages = formatMessages(
			messages,
			systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
			agentLoopPrompt,
			this.maxHistoryLength,
			model
		);
		temperature =
			temperature ?? getDefaultTemperature( this.service, model );
		const max_tokens =
			maxTokens ?? getDefaultMaxTokens( this.service, model );

		const response = await this.call( {
			model,
			temperature,
			max_tokens,
			messages,
			tools,
			feature,
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
	 * @param {string}        request.feature     The WPCOM feature slug for this product (WPCOM endpoints only)
	 *
	 * @return {Promise<Object>} The response object
	 */
	async call( {
		model,
		temperature,
		max_tokens,
		messages,
		tools,
		tool_choice = null,
		feature,
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

		const headers = {
			Authorization: `Bearer ${ this.apiKey }`,
			'Content-Type': 'application/json',
			'Access-Control-Request-Headers':
				'authorization,content-type,X-WPCOM-AI-Feature',
		};

		if (
			feature &&
			[
				ChatModelService.WPCOM_JETPACK_AI,
				ChatModelService.WPCOM_OPENAI,
			].includes( this.service )
		) {
			// params.feature = feature;
			headers[ 'X-WPCOM-AI-Feature' ] = feature;
		}

		console.log(
			`Calling ${ this.service } with model ${ model }, temperature ${ temperature }, max_tokens ${ max_tokens }`
		);

		const request = await fetch(
			getServiceChatCompletionUrl( this.service ),
			{
				method: 'POST',
				headers,
				body: JSON.stringify( params ),
			}
		);

		if ( request.status === 401 ) {
			throw new Error( 'Unauthorized' );
		} else if ( request.status === 429 ) {
			throw new Error( 'Rate limit exceeded' );
		} else if ( request.status === 500 ) {
			const responseText = await request.text();
			throw new Error( `Internal server error: ${ responseText }` );
		}

		let response;

		try {
			response = await request.json();
		} catch ( error ) {
			console.error( 'Error parsing response', error );
			throw new Error( 'Unexpected response format' );
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
}

export default ChatModel;
