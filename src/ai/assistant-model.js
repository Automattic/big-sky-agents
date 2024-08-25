// TODO: extract all this to a JSON configuration file
export const AssistantModelService = {
	WPCOM_OPENAI: 'wpcom-openai', // the wpcom OpenAI proxy
	WPCOM: 'wpcom', // WPCOM native
	OPENAI: 'openai',
	LANGGRAPH_CLOUD: 'langgraph-cloud',
	getAvailable: () => {
		const services = [
			AssistantModelService.WPCOM_OPENAI,
			AssistantModelService.WPCOM,
			AssistantModelService.OPENAI,
			AssistantModelService.LANGGRAPH_CLOUD,
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
	GPT_4O_MINI: 'gpt-4o-mini',
	isMultimodal: ( model ) => model === AssistantModelType.GPT_4O,
	supportsToolMessages: ( model ) =>
		[ AssistantModelType.GPT_4O, AssistantModelType.GPT_4_TURBO ].includes(
			model
		),
	getAvailable: ( /* service */ ) => {
		return [
			AssistantModelType.GPT_4O_MINI,
			AssistantModelType.GPT_4_TURBO,
			AssistantModelType.GPT_4O,
		];
	},
	getDefault( /* service = null */ ) {
		return AssistantModelType.GPT_4O;
	},
};

class AssistantModel {
	constructor( {
		apiKey,
		assistantId,
		openAiOrganization,
		feature,
		sessionId,
		baseUrl,
	} ) {
		this.apiKey = apiKey;
		this.assistantId = assistantId;
		this.openAiOrganization = openAiOrganization;
		this.feature = feature;
		this.sessionId = sessionId;
		this.baseUrl = baseUrl;
	}

	getApiKey() {
		return this.apiKey;
	}

	/**
	 * Create a thread
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
	 * Delete a thread
	 * see: https://platform.openai.com/docs/api-reference/threads/deleteThread
	 * @param {string} threadId
	 * @return {Promise<Object>} The response object
	 */
	async deleteThread( threadId ) {
		const headers = this.getHeaders();
		const deleteThreadRequest = await fetch(
			`${ this.getServiceUrl() }/threads/${ threadId }`,
			{
				method: 'DELETE',
				headers,
			}
		);
		// this doesn't return anything in langgraph cloud anyway
		return {};
		// return await this.getResponse( deleteThreadRequest );
	}

	/**
	 * This is currently only used by langgraph.
	 * https://a8c-graphs-57eb16cdfddc56528ca96d5463f5f983.default.us.langgraph.app/docs#tag/assistantscreate/POST/assistants
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
	async *createThreadRunEventStream( request ) {
		const headers = this.getHeaders();
		const url = `${ this.getServiceUrl() }/threads/${
			request.threadId
		}/runs`;

		// Using fetch to establish the connection
		const response = await fetch( url, {
			method: 'POST',
			headers,
			body: JSON.stringify( {
				stream: true,
				assistant_id: request.assistantId,
				instructions: request.instructions,
				additional_instructions: request.additionalInstructions,
				additional_messages: request.additionalMessages,
				tools: request.tools,
				model: request.model ?? this.getDefaultModel(),
				temperature:
					request.temperature ?? this.getDefaultTemperature(),
				max_completion_tokens:
					request.maxCompletionTokens ?? this.getDefaultMaxTokens(),
				truncation_strategy: request.truncationStrategy,
				response_format: request.responseFormat,
			} ),
		} );

		if ( ! response.ok ) {
			throw new Error(
				`Failed to create thread run: ${ response.statusText }`
			);
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder( 'utf-8' );
		let buffer = '';

		try {
			while ( true ) {
				const { done, value } = await reader.read();
				if ( done ) {
					break;
				}

				buffer += decoder.decode( value, { stream: true } );

				let boundary = buffer.indexOf( '\n\n' );
				while ( boundary !== -1 ) {
					const chunk = buffer.slice( 0, boundary );
					buffer = buffer.slice( boundary + 2 );

					const event = this.parseEvent( chunk );
					if ( event ) {
						yield event;
					}

					boundary = buffer.indexOf( '\n\n' );
				}
			}
		} catch ( err ) {
			console.error( 'Stream reading error:', err );
		} finally {
			reader.releaseLock();
		}
	}

	parseEvent( chunk ) {
		const lines = chunk.split( '\n' );
		let event = null;
		let data = '';

		for ( const line of lines ) {
			if ( line.startsWith( 'event:' ) ) {
				event = line.slice( 6 ).trim();
			} else if ( line.startsWith( 'data:' ) ) {
				data += line.slice( 5 ).trim();
			}
		}

		if ( event && data ) {
			if ( data === '[DONE]' ) {
				return { event: 'done' };
			}
			try {
				const parsedData = JSON.parse( data );
				return { event, data: parsedData };
			} catch ( e ) {
				console.error( 'Error parsing JSON message:', e, data );
			}
		}

		return null;
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

	async submitToolOutputs( threadId, runId, toolOutputs ) {
		const headers = this.getHeaders();
		const submitToolOutputsRequest = await fetch(
			`${ this.getServiceUrl() }/threads/${ threadId }/runs/${ runId }/submit_tool_outputs`,
			{
				method: 'POST',
				headers,
				body: JSON.stringify( {
					tool_outputs: toolOutputs,
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
		} else if ( request.status === 404 ) {
			throw new Error( 'Not found' );
		} else if ( request.status === 429 ) {
			throw new Error( 'Rate limit exceeded' );
		} else if ( request.status === 500 ) {
			const response = await request.json();
			throw new Error( `Internal server error: ${ response }` );
		}

		const response =
			request.method !== 'DELETE' ? await request.json() : {};

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
		const headers = {
			Authorization: `Bearer ${ this.apiKey }`,
			'Content-Type': 'application/json',
			'OpenAI-Beta': 'assistants=v2',
		};

		if ( this.openAiOrganization ) {
			headers[ 'OpenAI-Organization' ] = this.openAiOrganization;
		}

		return headers;
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
		// throw an error if the baseUrl is not set
		if ( ! this.baseUrl ) {
			throw new Error( 'Base URL is not set' );
		}
		return this.baseUrl;
	}

	static getInstance( service, apiKey, feature, sessionId, opts = {} ) {
		switch ( service ) {
			case AssistantModelService.OPENAI:
				return new OpenAIAssistantModel( {
					apiKey,
					feature,
					sessionId,
					...opts,
				} );
			case AssistantModelService.WPCOM:
				return new WPCOMOpenAIAssistantModel( {
					apiKey,
					feature,
					sessionId,
					...opts,
				} );
			case AssistantModelService.WPCOM_OPENAI:
				return new WPCOMOpenAIProxyAssistantModel( {
					apiKey,
					feature,
					sessionId,
					...opts,
				} );
			case AssistantModelService.LANGGRAPH_CLOUD:
				return new LangGraphCloudAssistantModel( {
					apiKey,
					feature,
					sessionId,
					...opts,
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

export class WPCOMOpenAIProxyAssistantModel extends AssistantModel {
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
		return 'https://public-api.wordpress.com/wpcom/v2/openai-proxy/v1';
	}
}

export class OpenAIAssistantModel extends AssistantModel {
	getDefaultModel() {
		return AssistantModelType.GPT_4O;
	}

	getServiceUrl() {
		return 'https://api.openai.com/v1';
	}
}

const filterLangGraphMessages = ( messages, thread_id ) => {
	// tool calls are in this weird format:
	/// "tool_calls": [
	// {
	// 	"name": "tavily_search_results_json",
	// 	"args": {
	// 	  "query": "books about cheese"
	// 	},
	// 	"id": "call_D7bfbEc7K3YeaJkVDakcXEwi",
	// 	"type": "tool_call"
	//   }
	// ],

	console.warn( 'filterLangGraphMessages', messages );

	return messages.map( ( message ) => {
		let role;
		if ( message.type === 'tool' ) {
			role = 'tool';
		} else if ( message.type === 'ai' ) {
			role = 'assistant';
		} else if ( message.type === 'human' ) {
			role = 'user';
		} else {
			role = message.role;
		}
		return {
			id: message.id ?? message.additional_kwargs?.id,
			thread_id,
			role,
			additional_kwargs: message.additional_kwargs,
			content: message.content,
			name: message.name,
			tool_call_id: message.tool_call_id,
			tool_calls: message.additional_kwargs?.tool_calls,
			created_at: message.additional_kwargs?.created_at,
		};
	} );
};

const filterOpenAIMessagesForLangGraph = ( message ) => {
	let langgraphRole;
	if ( message.role === 'assistant' ) {
		langgraphRole = 'ai';
	} else if ( message.role === 'user' ) {
		langgraphRole = 'human';
	} else if ( message.role === 'tool' ) {
		langgraphRole = 'tool';
	} else {
		langgraphRole = message.role;
	}
	return {
		id: message.id,
		content: message.content,
		// additional_kwargs: {
		// 	id: message.id, // cache it here because langgraph overwrites this value

		// },
		created_at: message.created_at ?? Date.now() / 1000,
		tool_calls: message.tool_calls,
		type: langgraphRole,
	};
};

export class LangGraphCloudAssistantModel extends AssistantModel {
	getHeaders() {
		const headers = super.getHeaders();
		if ( this.apiKey ) {
			headers[ 'X-Api-Key' ] = this.apiKey;
			// delete Authorization
			delete headers.Authorization;
		}
		return headers;
	}

	getDefaultModel() {
		return AssistantModelType.GPT_4O;
	}

	// override getresponse to ignore the expectedObject
	async getResponse( request ) {
		return await super.getResponse( request );
	}

	// langgraph threads use state rather than messages
	async getThreadMessages( threadId ) {
		const headers = this.getHeaders();
		const getMessagesRequest = await fetch(
			`${ this.getServiceUrl() }/threads/${ threadId }/state`,
			{
				method: 'GET',
				headers,
			}
		);
		const getMessagesResponse =
			await this.getResponse( getMessagesRequest );
		if ( getMessagesResponse.values.messages ) {
			return {
				data: filterLangGraphMessages(
					getMessagesResponse.values.messages,
					threadId
				),
			};
		}
		return { data: [] };
	}

	async getThreadRuns( threadId ) {
		// get super.getThreadRuns and return { data: the response }
		const threadRunsResponse = await super.getThreadRuns( threadId );
		return { data: threadRunsResponse };
	}

	/**
	 * This is currently only used by langgraph.
	 * https://a8c-graphs-57eb16cdfddc56528ca96d5463f5f983.default.us.langgraph.app/docs#tag/assistantscreate/POST/assistants
	 *
	 * @param {*}      request
	 * @param {string} request.name
	 * @param {string} request.description
	 * @param {Object} request.graph_id
	 * @param {Object} request.config
	 * @param {Object} request.metadata
	 * @return {Promise<Object>} The response object
	 */
	async createAssistant( request ) {
		const langgraphRequest = {
			graph_id: request.graph_id,
			config: {
				configurable: {
					// TODO: add configurable fields
					user_id: 1,
				},
			},
			metadata: {
				name: request.name,
				description: request.description,
				...request.metadata,
			},
		};
		const headers = this.getHeaders( request );
		const createAssistantRequest = await fetch(
			`${ this.getServiceUrl() }/assistants`,
			{
				method: 'POST',
				headers,
				body: JSON.stringify( langgraphRequest ),
			}
		);
		return await this.getResponse( createAssistantRequest, 'assistant' );
	}

	// createThreadRun has an 'input' param in langgraph cloud
	async createThreadRun( request ) {
		const params = {
			assistant_id: request.assistantId,
			metadata: {},
			input: {
				messages: request.additionalMessages.map(
					filterOpenAIMessagesForLangGraph
				),
			},
			// config: {
			// 	configurable: {},
			// },
			// instructions: request.instructions,
			// additional_instructions: request.additionalInstructions,
			// additional_messages: request.additionalMessages,
			// tools: request.tools,
			// model: request.model ?? this.getDefaultModel(),
			// temperature: request.temperature ?? this.getDefaultTemperature(),
			// max_completion_tokens:
			// 	request.maxCompletionTokens ?? this.getDefaultMaxTokens(),
			// truncation_strategy: request.truncationStrategy,
			// response_format: request.responseFormat,
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

	/**
	 *
	 * @param {*}      request
	 * @param {string} request.threadId
	 * @param {string} request.assistantId
	 * @param {Array}  request.additionalMessages
	 * @return {*} An async iterable of events
	 */
	async *createThreadRunEventStream( request ) {
		const headers = this.getHeaders();
		const url = `${ this.getServiceUrl() }/threads/${
			request.threadId
		}/runs/stream`;

		// Using fetch to establish the connection
		const response = await fetch( url, {
			method: 'POST',
			headers,
			body: JSON.stringify( {
				stream_mode: [ 'updates' ], // also: values, messages, events, debug
				assistant_id: request.assistantId,
				metadata: {},
				input: {
					messages: request.additionalMessages.map(
						filterOpenAIMessagesForLangGraph
					),
				},
			} ),
		} );

		if ( ! response.ok ) {
			throw new Error(
				`Failed to create thread run: ${ response.statusText }`
			);
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder( 'utf-8' );
		let buffer = '';
		let threadRunId = null;

		try {
			while ( true ) {
				const { done, value } = await reader.read();
				if ( done ) {
					yield {
						event: 'thread.run.completed',
						data: {
							id: threadRunId,
							status: 'completed',
						},
					};
					break;
				}

				buffer += decoder.decode( value, { stream: true } );

				// Split the buffer by double newline, accounting for different newline characters
				const chunks = buffer.split( /\r?\n\r?\n/ );

				// Process all complete chunks
				for ( let i = 0; i < chunks.length - 1; i++ ) {
					const chunk = chunks[ i ].trim();
					if ( chunk ) {
						const event = this.parseEvent( chunk );
						if ( event ) {
							console.warn( 'event', event );
							if (
								event.event === 'metadata' &&
								event.data.run_id
							) {
								threadRunId = event.data.run_id;
								const threadRun = {
									id: threadRunId,
									status: 'queued',
								};

								// simulate OpenAI assistants behavior for now
								yield {
									event: 'thread.run.created',
									data: threadRun,
								};

								yield {
									event: 'thread.run.in_progress',
									data: {
										...threadRun,
										status: 'in_progress',
									},
								};
							}
							if ( event.event === 'updates' ) {
								if ( event.data.agent?.messages ) {
									const messages = filterLangGraphMessages(
										[ event.data.agent.messages ],
										request.threadId
									);
									for ( const message of messages ) {
										yield {
											event: 'thread.message.completed',
											data: message,
										};
									}
								}

								if ( event.data.tools?.messages ) {
									const messages = filterLangGraphMessages(
										[ event.data.tools.messages ],
										request.threadId
									);
									for ( const message of messages ) {
										yield {
											event: 'thread.message.completed',
											data: message,
										};
									}
								}
							}
						}
					}
				}

				// Keep the last (possibly incomplete) chunk in the buffer
				buffer = chunks[ chunks.length - 1 ];
			}
		} catch ( err ) {
			console.error( 'Stream reading error:', err );
		} finally {
			reader.releaseLock();
		}
	}
}

export default AssistantModel;
