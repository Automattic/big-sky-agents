import { createReduxStore, createSelector } from '@wordpress/data';
import uuidv4 from '../utils/uuid.js';
import ChatModel from '../ai/chat-model.js';
import AssistantModel, {
	AssistantModelService,
} from '../ai/assistant-model.js';
import { actions as agentsActions } from './agents.js';

export const THREAD_RUN_ACTIVE_STATUSES = [
	'queued',
	'in_progress',
	'requires_action',
	'cancelling',
	'completed',
	'success', // langgraph cloud
];

export const THREAD_RUN_EXPIRED_STATUSES = [
	'expired',
	'failed',
	'incomplete',
	'cancelled',
];

export const THREAD_RUN_RUNNING_STATUSES = [
	'queued',
	'in_progress',
	'cancelling',
];

// export const THREAD_RUN_CURRENT_STATUSES = [
// 	'queued',
// 	'in_progress',
// 	'requires_action',
// 	'cancelling',
// 	'cancelled',
// ];

const isLocalStorageAvailable = typeof localStorage !== 'undefined';

export const THREAD_RUN_COMPLETED_STATUSES = [
	// 'cancelled',
	// 'failed',
	'completed',
	'success', // langgraph cloud
];

const initialState = {
	// Global
	error: null,
	enabled: true,
	assistantEnabled: false,
	autoCreateAssistant: false,
	feature: 'unknown',

	// LLM related
	model: null,
	service: null,
	temperature: 0.1,
	apiKey: null,
	stream: false,
	response_format: 'text',

	// graph related (langgraph)
	graphConfig: {},

	// Chat-API-related
	messages: [],
	documents: [],
	tool_calls: [],
	isToolRunning: false,
	isFetchingChatCompletion: false,

	// Assistants-API-related
	assistantId: null, // The assistant ID
	defaultAssistantId: isLocalStorageAvailable
		? localStorage.getItem( 'assistantId' )
		: null, // The default assistant ID
	openAiOrganization: null,
	baseUrl: null, // default to null
	threadId: isLocalStorageAvailable
		? localStorage.getItem( 'threadId' )
		: null, // The assistant thread ID
	threadRuns: [], // The Assistant thread runs
	threadRunsUpdated: null, // The last time the thread runs were updated
	threadMessagesUpdated: null, // The last time Assistant messages were updated
	syncedThreadMessagesAt: null, // The last time synced messages were updated
	isCreatingAssistant: false,
	isCreatingThread: false,
	isDeletingThread: false,
	isCreatingThreadRun: false,
	isFetchingThreadRun: false,
	isFetchingThreadRuns: false,
	isCreatingThreadMessage: false,
	isFetchingThreadMessages: false,
	isSubmittingToolOutputs: false,
};

/**
 * Converts an Chat Completions-formatted message to an Assistants-API-formatted message
 * @param {*} message The message to transform
 * @return {*} The transformed message
 */
const chatMessageToThreadMessage = ( message ) => {
	let filteredContent = message.content;

	// the message.content is sometimes an array like this:
	// [{ type: 'text', text: { annotations: [], value: 'foo' }}]
	// it needs to be transformed to this:
	// [{ type: 'text', text: 'foo' }]
	// TODO: do the same thing when syncing back to the assistant API
	if ( Array.isArray( filteredContent ) ) {
		filteredContent = filteredContent.map( ( content ) => {
			if (
				content.type === 'text' &&
				typeof content.text?.value === 'string'
			) {
				return {
					...content,
					text: content.text.value,
				};
			}
			return content;
		} );
		// sometimes it's just a string. These, too, need to be converted to the correct format. The API appears to be inconsistent in this regard.
	} else if ( typeof filteredContent === 'string' ) {
		filteredContent = [
			{
				type: 'text',
				text: filteredContent,
			},
		];
		// an assistant tool call message usually has no content, but this is invalid in the assistant API
	} else if ( ! filteredContent.length && message.tool_calls ) {
		filteredContent = [
			{
				type: 'text',
				text:
					'Invoked tool calls: ' +
					message.tool_calls
						.map(
							( toolCall ) =>
								`${ toolCall.function.name }(${ JSON.stringify(
									toolCall.function.arguments
								) })`
						)
						.join( ', ' ),
			},
		];
	}

	return {
		...message,
		content: filteredContent,
	};
};

/**
 * Ensure that a message is massaged into the correct internal format, even if it was created by the Assistant API
 *
 * @param {Object} message
 * @return {Object} The filtered message
 */
function filterChatMessage( message ) {
	let filteredContent = message.content;
	// let filteredToolCalls = message.tool_calls;

	if ( typeof filteredContent === 'undefined' || filteredContent === null ) {
		filteredContent = '';
	}
	// the message.content is sometimes an array like this:
	// [{ type: 'text', text: { annotations: [], value: 'foo' }}]
	// it needs to be transformed to this:
	// [{ type: 'text', text: 'foo' }]
	// TODO: do the same thing when syncing back to the assistant API
	if ( Array.isArray( filteredContent ) ) {
		filteredContent = filteredContent.map( ( content ) => {
			if (
				content.type === 'text' &&
				typeof content.text?.value === 'string'
			) {
				return {
					...content,
					text: content.text.value,
				};
			}
			return content;
		} );
	}

	return {
		...message,
		content: filteredContent,
	};
}

/**
 * Reset the state of the chat.
 */
const reset =
	() =>
	async ( { dispatch, select } ) => {
		const { threadId, isAssistantAvailable } = select( ( state ) => ( {
			threadId: state.root.threadId,
			isAssistantAvailable: selectors.isAssistantAvailable( state.root ),
		} ) );
		dispatch( clearMessages() );
		dispatch( clearError() );
		if ( threadId && isAssistantAvailable ) {
			dispatch( deleteThread );
		}
	};

const getChatModel = ( select ) => {
	const { service, apiKey, feature, sessionId } = select( ( state ) => ( {
		service: state.root.service,
		apiKey: state.root.apiKey,
		feature: state.root.feature,
		sessionId: state.root.sessionId,
	} ) );
	if ( ! service || ! apiKey ) {
		throw new Error( 'Service and API key are required' );
	}
	return ChatModel.getInstance( service, apiKey, feature, sessionId );
};

/**
 * Make a Chat Completion call
 *
 * @param {Object}        request
 * @param {string}        request.model
 * @param {number}        request.temperature
 * @param {number}        request.maxTokens
 * @param {Array<Object>} request.messages
 * @param {Array<Object>} request.tools
 * @param {Object}        request.instructions
 * @param {Object}        request.additionalInstructions
 */
const runChatCompletion =
	( request ) =>
	async ( { select, dispatch } ) => {
		const {
			stream,
			model,
			temperature,
			messages,
			feature,
			response_format,
		} = select( ( state ) => {
			return {
				model: state.root.model,
				temperature: state.root.temperature,
				messages: state.root.messages,
				feature: state.root.feature,
				stream: state.root.stream,
				response_format: state.root.response_format || '',
			};
		} );

		// dispatch an error if service or apiKey are missing
		if ( ! model || ! temperature ) {
			console.error( 'Model and temperature are required', {
				model,
				temperature,
				messages,
				feature,
			} );
			dispatch( {
				type: 'CHAT_ERROR',
				error: 'Model and temperature are required',
			} );
			return;
		}

		dispatch( { type: 'CHAT_BEGIN_REQUEST' } );
		try {
			if ( stream ) {
				dispatch( { type: 'CHAT_BEGIN_REQUEST' } );
				const chatCompletionThreadStream = await getChatModel(
					select
				).runStream( {
					...request,
					messages,
					model,
					temperature,
					feature,
					// graphConfig,
				} );
				const message = {
					created_at: Date.now() / 1000,
					role: 'assistant',
					content: '',
					tool_calls: [],
				};
				for await ( const event of chatCompletionThreadStream ) {
					switch ( event.event ) {
						case 'chat.message.partial':
							// handle tool_calls
							message.id = event.data.id; // redundant but oh well
							if ( event.data.choices[ 0 ].delta.tool_calls ) {
								for ( const toolCall of event.data.choices[ 0 ]
									.delta.tool_calls ) {
									const existingToolCall = message.tool_calls[
										toolCall.index
									] ?? {
										function: {
											name: '',
											arguments: '',
										},
									};

									const updatedToolCall = {
										...existingToolCall,
									};

									if ( toolCall.id ) {
										updatedToolCall.id = toolCall.id;
									}

									if ( toolCall.type ) {
										updatedToolCall.type = toolCall.type;
									}

									if ( toolCall.function.name ) {
										updatedToolCall.function.name +=
											toolCall.function.name;
									}

									if ( toolCall.function.arguments ) {
										updatedToolCall.function.arguments +=
											toolCall.function.arguments;
									}

									message.tool_calls[ toolCall.index ] =
										updatedToolCall;
								}
							}

							// handle content
							if ( event.data.choices[ 0 ].delta.content ) {
								message.content +=
									event.data.choices[ 0 ].delta.content;
							}

							if ( event.data.finish_reason ) {
								message.finish_reason =
									event.data.finish_reason;
							}

							dispatch( {
								type: 'ADD_MESSAGE',
								message,
							} );
							break;
						case 'chat.completion.error':
							console.error(
								'Chat completion error',
								event.data
							);
							dispatch( {
								type: 'CHAT_ERROR',
								error: event.data.error,
							} );
							dispatch( { type: 'CHAT_END_REQUEST' } );
							break;
						case 'done':
							dispatch( { type: 'CHAT_END_REQUEST' } );
							break;
					}
				}
				return;
			}
			const assistantMessage = await getChatModel( select ).run( {
				...request,
				messages,
				model,
				temperature,
				feature,
				response_format,
			} );
			dispatch( actions.addMessage( assistantMessage ) );
			dispatch( { type: 'CHAT_END_REQUEST' } );
		} catch ( error ) {
			console.error( 'Chat error', error );
			dispatch( { type: 'CHAT_ERROR', error: error.message } );
		}
	};

/**
 * Get the thread runs for a given thread.
 */
const updateThreadRuns =
	() =>
	async ( { select, dispatch } ) => {
		const threadId = select( ( state ) => state.root.threadId );
		dispatch( { type: 'GET_THREAD_RUNS_BEGIN_REQUEST' } );
		try {
			const threadRunsResponse =
				await getAssistantModel( select ).getThreadRuns( threadId );

			dispatch( {
				type: 'GET_THREAD_RUNS_END_REQUEST',
				ts: Date.now(),
				threadRuns: threadRunsResponse.data,
			} );
		} catch ( error ) {
			console.error( 'Get Thread Runs Error', error );
			if (
				error.message === 'Not found' ||
				error.message === 'Unprocessable entity'
			) {
				dispatch( deleteThread() );
			}
			dispatch( { type: 'GET_THREAD_RUNS_ERROR', error: error.message } );
		}
	};

/**
 * Get a thread run for a given thread.
 */
const updateThreadRun =
	() =>
	async ( { select, dispatch } ) => {
		const { threadId, threadRun } = select( ( state ) => ( {
			threadId: state.root.threadId,
			threadRun: getActiveThreadRun( state.root ),
		} ) );
		dispatch( { type: 'GET_THREAD_RUN_BEGIN_REQUEST' } );
		try {
			const updatedThreadRun = await getAssistantModel(
				select
			).getThreadRun( threadId, threadRun?.id );
			dispatch( {
				type: 'GET_THREAD_RUN_END_REQUEST',
				ts: Date.now(),
				threadRun: updatedThreadRun,
			} );
		} catch ( error ) {
			console.error( 'Thread error', error );
			dispatch( { type: 'GET_THREAD_RUN_ERROR', error: error.message } );
		}
	};

/**
 * Get the thread messages for a given thread.
 */
const updateThreadMessages =
	() =>
	async ( { select, dispatch } ) => {
		const threadId = select( ( state ) => state.root.threadId );
		dispatch( { type: 'GET_THREAD_MESSAGES_BEGIN_REQUEST' } );
		try {
			const threadMessagesResponse =
				await getAssistantModel( select ).getThreadMessages( threadId );

			// if there are messages, then set started to true
			if ( threadMessagesResponse.data.length ) {
				dispatch( agentsActions.setAgentStarted( true ) );
			}
			dispatch( {
				type: 'GET_THREAD_MESSAGES_END_REQUEST',
				ts: Date.now(),
				threadMessages: threadMessagesResponse.data,
				threadDocuments: threadMessagesResponse.documents,
			} );
		} catch ( error ) {
			console.error( 'Get Thread Messages Error', error );
			// if the message is "not found", dispatch the delete thread action
			if (
				error.message === 'Not Found' ||
				error.message === 'Unprocessable entity'
			) {
				dispatch( deleteThread() );
			}
			dispatch( {
				type: 'GET_THREAD_MESSAGES_ERROR',
				error: error.message,
			} );
		}
	};

const getAssistantModel = ( select ) => {
	const { service, apiKey, feature, openAiOrganization, baseUrl } = select(
		( state ) => {
			return {
				service: state.root.service,
				apiKey: state.root.apiKey,
				feature: state.root.feature,
				openAiOrganization: state.root.openAiOrganization,
				baseUrl: state.root.baseUrl,
			};
		}
	);
	if ( ! service || ! apiKey ) {
		console.warn( 'Service and API key are required', {
			service,
			apiKey,
		} );
		throw new Error( 'Service and API key are required' );
	}
	return AssistantModel.getInstance( service, apiKey, feature, null, {
		openAiOrganization,
		baseUrl,
	} );
};

/**
 * Create a new assistant.
 *
 * @param {string} graphId The ID of the graph to use for the assistant.
 */
const createAssistant =
	( { graphId } ) =>
	async ( { select, dispatch } ) => {
		dispatch( { type: 'CREATE_ASSISTANT_BEGIN_REQUEST' } );
		try {
			const assistant = await getAssistantModel( select ).createAssistant(
				{ graph_id: graphId }
			);
			console.warn( 'createAssistant', assistant );
			dispatch( {
				type: 'CREATE_ASSISTANT_END_REQUEST',
				assistantId: assistant.assistant_id,
			} );
		} catch ( error ) {
			console.error( 'Create assistant error', error );
			dispatch( {
				type: 'CREATE_ASSISTANT_ERROR',
				error: error.message,
			} );
		}
	};

/**
 * Create a new thread.
 */
const createThread =
	() =>
	async ( { select, dispatch } ) => {
		dispatch( { type: 'CREATE_THREAD_BEGIN_REQUEST' } );
		try {
			const threadResponse =
				await getAssistantModel( select ).createThread();

			// langgraph threads have thread_id but not id
			const threadId = threadResponse.thread_id || threadResponse.id;

			dispatch( {
				type: 'CREATE_THREAD_END_REQUEST',
				threadId,
			} );
		} catch ( error ) {
			console.error( 'Create thread error', error );
			dispatch( { type: 'CREATE_THREAD_ERROR', error: error.message } );
		}
	};

/**
 * Delete a thread.
 */
const deleteThread =
	() =>
	async ( { select, dispatch } ) => {
		const threadId = select( ( state ) => state.root.threadId );
		dispatch( { type: 'DELETE_THREAD_BEGIN_REQUEST' } );
		try {
			await getAssistantModel( select ).deleteThread( threadId );
			dispatch( { type: 'DELETE_THREAD_END_REQUEST' } );
			dispatch( agentsActions.setAgentStarted( false ) );
		} catch ( error ) {
			console.error( 'Delete thread error', error );
			dispatch( { type: 'DELETE_THREAD_ERROR', error: error.message } );
		}
	};

/**
 * Create a new thread run.
 *
 * @param {Object} request
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
 * @return {Object} Yields the resulting actions
 */
const createThreadRun =
	( request ) =>
	async ( { select, dispatch } ) => {
		const {
			graphConfig,
			stream,
			threadId,
			assistantId,
			model,
			temperature,
		} = select( ( state ) => ( {
			threadId: state.root.threadId,
			assistantId: selectors.getAssistantId( state.root ),
			model: state.root.model,
			temperature: state.root.temperature,
			stream: state.root.stream,
			graphConfig: state.root.graphConfig,
		} ) );
		dispatch( { type: 'RUN_THREAD_BEGIN_REQUEST' } );
		try {
			if ( stream ) {
				// console.warn( 'streaming' );
				const threadRunEventStream = await getAssistantModel(
					select
				).createThreadRunEventStream( {
					...request,
					additionalMessages: request.additionalMessages?.map(
						chatMessageToThreadMessage
					),
					stream,
					threadId,
					assistantId,
					model,
					temperature,
					graphConfig,
				} );
				for await ( const event of threadRunEventStream ) {
					// console.warn( 'event', event );
					switch ( event.event ) {
						// Thread Run updates
						case 'thread.run.created':
							// dispatch( {
							// 	type: 'GET_THREAD_RUN_BEGIN_REQUEST',
							// } );
							break;
						case 'thread.run.queued':
						case 'thread.run.in_progress':
							dispatch( {
								type: 'UPDATE_THREAD_RUN',
								threadRun: event.data,
								ts: Date.now(),
							} );
							break;
						case 'thread.run.requires_action':
							dispatch( {
								type: 'UPDATE_THREAD_RUN',
								ts: Date.now(),
								additionalMessages: request.additionalMessages,
								threadRun: event.data,
							} );
							break;
						case 'thread.run.completed':
							dispatch( {
								type: 'RUN_THREAD_END_REQUEST',
								ts: Date.now(),
								additionalMessages: request.additionalMessages,
								threadRun: event.data,
							} );
							break;

						// Step (aka Tool Call) updates
						case 'thread.run.step.created':
							break;
						case 'thread.run.step.in_progress':
						case 'thread.run.step.completed':
							if (
								event.data.step_details.type === 'tool_calls'
							) {
								const tool_calls = event.data.tool_calls;
								tool_calls?.forEach( ( toolCall ) => {
									dispatch( {
										type: 'ADD_MESSAGE_TOOL_CALL',
										ts: Date.now(),
										id: `tc:${ toolCall.id }`,
										tool_call_id: toolCall.id,
									} );
								} );
							}
							break;

						// console.warn(
						// 	'thread.run.step.completed',
						// 	event.data
						// );
						// break;
						case 'thread.run.step.delta':
							// console.warn( 'run step delta', event.data );
							// if (
							// 	event.data.delta.step_details.type ===
							// 	'tool_calls'
							// ) {
							// 	event.data.delta.step_details.tool_calls.forEach(
							// 		( toolCall ) => {
							// 			dispatch( {
							// 				type: 'TOOL_UPDATE_REQUEST',
							// 				ts: Date.now(),
							// 				delta: toolCall,
							// 			} );
							// 		}
							// 	);
							// }
							break;

						case 'thread.message.created':
							dispatch( {
								type: 'ADD_MESSAGE',
								message: event.data,
							} );
							break;
						case 'thread.message.in_progress':
							break;
						case 'thread.message.delta':
							console.warn( 'delta', event.data );
							dispatch( {
								type: 'APPLY_MESSAGE_CONTENT_DELTA',
								id: event.data.id,
								content: event.data.delta.content,
							} );
							break;
						// langgraph-specific
						case 'thread.message.partial':
							dispatch( {
								type: 'ADD_MESSAGE',
								message: event.data,
							} );
							break;
						case 'thread.message.completed':
							dispatch( {
								type: 'ADD_MESSAGE',
								message: event.data,
							} );
							break;
						case 'done':
							console.log( 'DONE' );
							// dispatch( {
							// 	type: 'RUN_THREAD_END_REQUEST',
							// 	ts: Date.now(),
							// 	additionalMessages: request.additionalMessages,
							// 	threadRun: event.data,
							// } );
							break;
						default:
							console.log( event );
					}
				}
			} else {
				const createThreadRunResponse = await getAssistantModel(
					select
				).createThreadRun( {
					...request,
					additionalMessages: request.additionalMessages?.map(
						chatMessageToThreadMessage
					),
					threadId,
					assistantId,
					model,
					temperature,
				} );
				dispatch( {
					type: 'RUN_THREAD_END_REQUEST',
					ts: Date.now(),
					additionalMessages: request.additionalMessages,
					threadRun: createThreadRunResponse,
				} );
			}
		} catch ( error ) {
			console.error( 'Run Thread Error', error );
			return dispatch( {
				type: 'RUN_THREAD_ERROR',
				error: error.message,
			} );
		}
	};

/**
 * Submit tool outputs for a given thread run.
 *
 * @param {Object} options
 * @param {Array}  options.toolOutputs
 * @return {Object} Yields the resulting actions
 */
const submitToolOutputs =
	( { toolOutputs } ) =>
	async ( { select, dispatch } ) => {
		const { threadId, threadRun } = select( ( state ) => ( {
			threadId: state.root.threadId,
			threadRun: getActiveThreadRun( state.root ),
		} ) );
		try {
			dispatch( { type: 'SUBMIT_TOOL_OUTPUTS_BEGIN_REQUEST' } );
			const updatedRun = await getAssistantModel(
				select
			).submitToolOutputs( threadId, threadRun?.id, toolOutputs );
			dispatch( {
				type: 'SUBMIT_TOOL_OUTPUTS_END_REQUEST',
				threadRun: updatedRun,
			} );
		} catch ( error ) {
			console.error( 'Submit Tool Outputs Error', error );
			return {
				type: 'SUBMIT_TOOL_OUTPUTS_ERROR',
				error: error.message,
			};
		}
	};

/**
 * Set the result of a tool call, and if it's a promise then resolve it first.
 *
 * @param {number} toolCallId
 * @param {*}      promise
 * @return {Object} The resulting action
 */
const setToolResult =
	( toolCallId, promise ) =>
	async ( { dispatch } ) => {
		dispatch( {
			type: 'TOOL_BEGIN_REQUEST',
			ts: Date.now(),
			tool_call_id: toolCallId,
		} );
		try {
			const result = await promise;
			dispatch( {
				type: 'TOOL_END_REQUEST',
				id: `tc:${ toolCallId }`,
				ts: Date.now(),
				tool_call_id: toolCallId,
				result,
			} );
		} catch ( error ) {
			dispatch( {
				type: 'TOOL_ERROR',
				id: toolCallId,
				error: error.message || 'There was an error',
			} );
		}
	};

const addMessageToThread =
	( { message } ) =>
	async ( { select, dispatch } ) => {
		// add the message to the active thread
		if ( ! message.id ) {
			throw new Error( 'Message must have an ID' );
		}
		const threadId = select( ( state ) => state.root.threadId );
		dispatch( { type: 'CREATE_THREAD_MESSAGE_BEGIN_REQUEST' } );
		try {
			const newMessage = await getAssistantModel(
				select
			).createThreadMessage(
				threadId,
				chatMessageToThreadMessage( message )
			);
			dispatch( {
				type: 'CREATE_THREAD_MESSAGE_END_REQUEST',
				ts: Date.now(),
				originalMessageId: message.id,
				message: newMessage,
			} );
		} catch ( error ) {
			console.error( 'Add message to thread error', error );
			return {
				type: 'CREATE_THREAD_MESSAGE_ERROR',
				error: error.message ?? error,
			};
		}
	};

/**
 * REDUCERS
 */

const addMessageReducer = ( state, message ) => {
	message = filterChatMessage( message );

	// if the message has the same ID as an existing message, update it
	const existingMessageIndex = state.messages.findIndex(
		( existingMessage ) => existingMessage.id === message.id
	);

	if ( existingMessageIndex !== -1 ) {
		// update thread_id if present
		return {
			...state,
			threadMessagesUpdated: Date.now(),
			messages: [
				...state.messages.slice( 0, existingMessageIndex ),
				{
					...state.messages[ existingMessageIndex ],
					thread_id: message.thread_id,
					state: message.state,
					content: message.content,
					additional_kwargs: message.additional_kwargs,
					tool_calls: message.tool_calls,
				},
				...state.messages.slice( existingMessageIndex + 1 ),
			],
		};
	}

	// special processing for tools - add the tool call messages
	if ( message.role === 'tool' && message.tool_call_id ) {
		// if there's an existing tool call result for this tool call ID, don't add it
		const existingToolCallResultMessage = state.messages.find(
			( existingMessage ) =>
				existingMessage.role === 'tool' &&
				existingMessage.tool_call_id === message.tool_call_id
		);

		if ( existingToolCallResultMessage ) {
			console.warn( 'tool call result already exists', {
				message,
				existingToolCallResultMessage,
			} );
			return state;
		}
	}

	// Ensure all messages have created_at
	if (
		! message.created_at ||
		state.messages.some( ( m ) => ! m.created_at )
	) {
		console.warn(
			'All messages must have a created_at timestamp',
			message,
			state.messages
		);
	}

	return {
		...state,
		threadMessagesUpdated: Date.now(),
		messages: sortMessageHistory( [ ...state.messages, message ] ),
	};
};

const sortMessageHistory = ( messages ) => {
	const sortedMessages = [ ...messages ];
	sortedMessages.sort( ( a, b ) => a.created_at - b.created_at );

	// Move tool messages after their corresponding assistant messages
	for ( let i = 0; i < sortedMessages.length; i++ ) {
		if (
			sortedMessages[ i ].role === 'assistant' &&
			sortedMessages[ i ].tool_calls &&
			sortedMessages[ i ].tool_calls.length > 0
		) {
			let insertIndex = i + 1;
			for ( let j = i + 1; j < sortedMessages.length; j++ ) {
				if (
					sortedMessages[ j ].role === 'tool' &&
					sortedMessages[ i ].tool_calls.some(
						( call ) => call.id === sortedMessages[ j ].tool_call_id
					)
				) {
					const toolMessage = sortedMessages.splice( j, 1 )[ 0 ];
					sortedMessages.splice( insertIndex, 0, toolMessage );
					insertIndex++;
				}
			}
		}
	}

	return sortedMessages;
};

const setAssistantIdReducer = ( state, assistantId ) => {
	if ( assistantId ) {
		localStorage.setItem( 'assistantId', assistantId );
	} else {
		localStorage.removeItem( 'assistantId' );
	}
	return {
		...state,
		assistantId,
	};
};

const setThreadIdReducer = ( state, threadId ) => {
	// if the threadId hasn't changed, just return unaltered state
	if ( state.threadId === threadId ) {
		return state;
	}

	if ( threadId ) {
		localStorage.setItem( 'threadId', threadId );
	} else {
		localStorage.removeItem( 'threadId' );
	}

	return {
		...state,
		threadId,
		messages: [],
		threadRuns: [],
		threadRunsUpdated: null,
		threadMessagesUpdated: null,
		syncedThreadMessagesAt: null,
	};
};

const updateThreadRunReducer = ( state, action ) => {
	const threadRun = action.threadRun;

	// now optionally update with tool call messages
	// this simulates an assistant request with tool calls coming from the Chat Completion API
	// conversely, when we get a tool call response via TOOL_END_REQUEST, we need to send that to the threads/$threadId/runs/$runId/submit_tool_outputs endpoint
	if (
		threadRun.status === 'requires_action' &&
		threadRun.required_action.type === 'submit_tool_outputs'
	) {
		const tool_calls =
			threadRun.required_action.submit_tool_outputs.tool_calls;

		// add an assistant message with the tool calls
		state = addMessageReducer( state, {
			id: `tr:${ threadRun.id }`,
			role: 'assistant',
			created_at: action.ts / 1000,
			tool_calls,
		} );
	}
	const existingThreadRunIndex = state.threadRuns.findIndex(
		( tr ) => tr.id === threadRun.id
	);
	if ( existingThreadRunIndex !== -1 ) {
		state = {
			...state,
			threadRuns: [
				...state.threadRuns.slice( 0, existingThreadRunIndex ),
				threadRun,
				...state.threadRuns.slice( existingThreadRunIndex + 1 ),
			],
		};
	} else {
		state = {
			...state,
			threadRuns: [ action.threadRun, ...state.threadRuns ],
		};
	}
	return state;
};

export const reducer = ( state = initialState, action ) => {
	switch ( action.type ) {
		// LLM-related
		case 'SET_ENABLED':
			return { ...state, enabled: action.enabled };
		case 'SET_ERROR':
			return { ...state, error: action.error };
		case 'SET_ASSISTANT_ENABLED':
			return { ...state, assistantEnabled: action.enabled };
		case 'SET_AUTO_CREATE_ASSISTANT':
			return {
				...state,
				autoCreateAssistant: action.autoCreateAssistant,
			};
		case 'SET_STREAM':
			return { ...state, stream: action.stream };
		case 'SET_SERVICE':
			return { ...state, service: action.service };
		case 'SET_API_KEY':
			return { ...state, apiKey: action.apiKey };
		case 'SET_BASE_URL':
			return { ...state, baseUrl: action.baseUrl };
		case 'SET_FEATURE':
			return { ...state, feature: action.feature };
		case 'SET_SESSION_ID':
			return { ...state, sessionId: action.sessionId };
		case 'SET_MODEL':
			return { ...state, model: action.model };
		case 'SET_TEMPERATURE':
			return { ...state, temperature: action.temperature };

		// Chat Completion
		case 'CHAT_BEGIN_REQUEST':
			return { ...state, isFetchingChatCompletion: true };
		case 'CHAT_END_REQUEST':
			return { ...state, isFetchingChatCompletion: false };
		case 'CHAT_ERROR':
			return {
				...state,
				isFetchingChatCompletion: false,
				error: action.error,
			};

		// Begin Tool Processing
		case 'TOOL_BEGIN_REQUEST':
			return {
				...state,
				tool_calls: [
					...state.tool_calls,
					{
						id: action.tool_call_id,
						created_at: action.ts,
					},
				],
				isToolRunning: true,
			};
		case 'TOOL_CALL_UPDATE':
			return {
				...state,
				tool_calls: state.tool_calls.map( ( tc ) => {
					if ( tc.id === action.tool_call_id ) {
						return {
							...tc,
							...action.update,
						};
					}
					return tc;
				} ),
			};
		case 'TOOL_UPDATE_REQUEST':
			return {
				...state,
				tool_calls: state.tool_calls.map( ( tc ) => {
					if ( tc.id === action.delta.id ) {
						return {
							name: action.delta.function.name ?? tc.name,
							arguments: action.delta.function.arguments
								? tc.arguments + action.delta.function.arguments
								: tc.arguments,
						};
					}
					return tc;
				} ),
			};
		case 'TOOL_END_REQUEST':
			return {
				...addMessageReducer( state, {
					role: 'tool',
					id: action.id,
					created_at: action.ts / 1000,
					tool_call_id: action.tool_call_id,
					content: action.result,
				} ),
				error: null,
				isToolRunning: false,
				tool_calls: state.tool_calls.filter(
					( tc ) => tc.id !== action.tool_call_id
				),
			};
		case 'TOOL_ERROR':
			return {
				...addMessageReducer( state, {
					role: 'tool',
					id: action.id,
					tool_call_id: action.tool_call_id,
					content: 'Error',
				} ),
				error: action.error,
				isToolRunning: false,
				tool_calls: state.tool_calls.map( ( tc ) => {
					if ( tc.id === action.tool_call_id ) {
						return {
							...tc,
							error: action.error,
						};
					}
					return tc;
				} ),
			};

		// Add and Clear Messages
		case 'ADD_MESSAGE':
			return addMessageReducer( state, action.message );
		case 'ADD_MESSAGE_TOOL_CALL':
			// add an assistant message with the tool calls
			state = addMessageReducer( state, {
				id: action.id,
				role: 'assistant',
				created_at: action.ts / 1000,
				tool_calls: action.tool_calls,
			} );
			return state;
		case 'APPLY_MESSAGE_CONTENT_DELTA':
			const id = action.id;
			const contentDelta = action.content;
			const messageIndex = state.messages.findIndex(
				( message ) => message.id === id
			);
			if ( messageIndex === -1 ) {
				return state;
			}
			const message = { ...state.messages[ messageIndex ] };
			console.warn( 'got message', message );
			contentDelta.forEach( ( delta ) => {
				const { index, text } = delta;
				if ( message.content[ index ] ) {
					message.content[ index ].text += text.value;
				} else {
					message.content.push( {
						type: 'text',
						text: text.value,
					} );
				}
			} );
			return {
				...state,
				messages: [
					...state.messages.slice( 0, messageIndex ),
					message,
					...state.messages.slice( messageIndex + 1 ),
				],
			};

		case 'SET_MESSAGES':
			return { ...state, messages: action.messages };

		/**
		 * Assistant-related reducers
		 */

		// Set Assistant ID
		case 'SET_ASSISTANT_ID':
			return setAssistantIdReducer( state, action.assistantId );
		case 'SET_GRAPH_CONFIG':
			return {
				...state,
				graphConfig: action.graphConfig,
			};
		case 'SET_GRAPH_ID':
			return {
				...state,
				graphId: action.graphId,
			};
		case 'SET_DEFAULT_ASSISTANT_ID':
			return {
				...state,
				defaultAssistantId: action.assistantId,
			};

		// Set Thread
		case 'SET_THREAD_ID':
			return setThreadIdReducer( state, action.threadId );

		// Create Assistant
		case 'CREATE_ASSISTANT_BEGIN_REQUEST':
			return {
				...setAssistantIdReducer( state, null ),
				isCreatingAssistant: true,
			};
		case 'CREATE_ASSISTANT_END_REQUEST':
			return {
				...setAssistantIdReducer( state, action.assistantId ),
				isCreatingAssistant: false,
			};
		case 'CREATE_ASSISTANT_ERROR':
			return {
				...setAssistantIdReducer( state, null ),
				isCreatingAssistant: false,
				error: action.error,
			};

		// Create Thread
		case 'CREATE_THREAD_BEGIN_REQUEST':
			return { ...state, isCreatingThread: true };
		case 'CREATE_THREAD_END_REQUEST':
			return {
				...setThreadIdReducer( state, action.threadId ),
				isCreatingThread: false,
			};
		case 'CREATE_THREAD_ERROR':
			return { ...state, isCreatingThread: false, error: action.error };

		// Delete Thread
		case 'DELETE_THREAD_BEGIN_REQUEST':
			return { ...state, isDeletingThread: true };
		case 'DELETE_THREAD_END_REQUEST':
			return {
				...setThreadIdReducer( state, null ),
				isDeletingThread: false,
			};
		case 'DELETE_THREAD_ERROR':
			return {
				...setThreadIdReducer( state, null ),
				isDeletingThread: false,
				error: action.error,
			};

		// Create Thread Message
		case 'CREATE_THREAD_MESSAGE_BEGIN_REQUEST':
			return { ...state, isCreatingThreadMessage: true };
		case 'CREATE_THREAD_MESSAGE_END_REQUEST':
			// set synced to true on the message with the matching id
			return {
				...state,
				messages: [
					...state.messages.map( ( m ) => {
						if ( m.id === action.originalMessageId ) {
							return filterChatMessage( action.message );
						}
						return m;
					} ),
				],
				syncedThreadMessagesAt: action.ts,
				isCreatingThreadMessage: false,
			};
		case 'CREATE_THREAD_MESSAGE_ERROR':
			return {
				...state,
				isCreatingThreadMessage: false,
				error: action.error,
			};

		// Create Thread Run
		case 'RUN_THREAD_BEGIN_REQUEST':
			return { ...state, isCreatingThreadRun: true };
		case 'RUN_THREAD_END_REQUEST':
			const additionalMessageIds =
				action.additionalMessages?.map( ( m ) => m.id ) ?? [];

			const updatedThreadRuns = state.threadRuns.map( ( tr ) => {
				if ( tr.id === action.threadRun.id ) {
					return action.threadRun;
				}
				return tr;
			} );

			return {
				...state,
				// for each message in action.additionalMessages, find them by id and set message.thread_id to action.threadRun.id
				messages: state.messages.map( ( m ) => {
					if ( additionalMessageIds.includes( m.id ) ) {
						return {
							...m,
							thread_id: state.threadId,
						};
					}
					return m;
				} ),
				isCreatingThreadRun: false,
				threadRunsUpdated: action.ts,
				threadMessagesUpdated: null, // force reloading of chat history
				threadRuns: updatedThreadRuns,
			};
		case 'RUN_THREAD_ERROR':
			return {
				...state,
				isCreatingThreadRun: false,
				error: action.error,
			};

		// Submit Tool Outputs
		case 'SUBMIT_TOOL_OUTPUTS_BEGIN_REQUEST':
			return { ...state, isSubmittingToolOutputs: true };
		case 'SUBMIT_TOOL_OUTPUTS_END_REQUEST':
			return {
				...state,
				isSubmittingToolOutputs: false,
				threadRuns: [
					action.threadRun,
					...state.threadRuns.filter(
						( tr ) => tr.id !== action.threadRun.id
					),
				],
			};
		case 'SUBMIT_TOOL_OUTPUTS_ERROR':
			return {
				...state,
				isSubmittingToolOutputs: false,
				error: action.error,
			};

		// Get Thread Run
		case 'GET_THREAD_RUN_BEGIN_REQUEST':
			return { ...state, isFetchingThreadRun: true };
		case 'GET_THREAD_RUN_END_REQUEST':
			return {
				...updateThreadRunReducer( state, action ),
				isFetchingThreadRun: false,
			};
		case 'GET_THREAD_RUN_ERROR':
			return {
				...state,
				isFetchingThreadRun: false,
				error: action.error,
			};

		case 'UPDATE_THREAD_RUN':
			return updateThreadRunReducer( state, action );
		// Get All Thread Runs
		case 'GET_THREAD_RUNS_BEGIN_REQUEST':
			return { ...state, isFetchingThreadRuns: true };
		case 'GET_THREAD_RUNS_END_REQUEST':
			console.warn( '🧠 GET_THREAD_RUNS_END_REQUEST', action );
			const threadsRequiringAction = action.threadRuns.filter(
				( tr ) =>
					tr.status === 'requires_action' &&
					tr.required_action.type === 'submit_tool_outputs'
			);
			const tool_calls = threadsRequiringAction.flatMap(
				( tr ) => tr.required_action.submit_tool_outputs.tool_calls
			);

			if ( tool_calls.length ) {
				const assistantMessage = {
					role: 'assistant',
					tool_calls,
				};
				state = addMessageReducer( state, assistantMessage );
			}

			return {
				...state,
				isFetchingThreadRuns: false,
				threadRunsUpdated: action.ts,
				threadRuns: action.threadRuns,
			};
		case 'GET_THREAD_RUNS_ERROR':
			return {
				...setThreadIdReducer( state, null ),
				isFetchingThreadRuns: false,
				error: action.error,
			};

		// Get Thread Messages
		case 'GET_THREAD_MESSAGES_BEGIN_REQUEST':
			return { ...state, isFetchingThreadMessages: true };
		case 'GET_THREAD_MESSAGES_END_REQUEST':
			// use addMessageReducer( state, message ) to add each message to the history
			// and update the tool_calls
			action.threadMessages.forEach( ( m ) => {
				// if the message is already in the history, update it
				state = addMessageReducer( state, m );
			} );
			return {
				...state,
				documents: action.threadDocuments,
				isFetchingThreadMessages: false,
				threadMessagesUpdated: action.ts,
			};
		case 'GET_THREAD_MESSAGES_ERROR':
			return {
				...state,
				documents: [],
				isFetchingThreadMessages: false,
				error: action.error,
			};
		default:
			return state;
	}
};

/**
 * Extract Tool Calls from state.
 *
 * @param {*}      state         The state
 * @param {string} function_name If provided, only return tool calls for this function
 * @return {Array} 	 An array of tool calls
 */
const getToolCalls = ( state, function_name = null ) => {
	const messagesWithToolCalls = state.messages
		.filter(
			( message ) =>
				message.role === 'assistant' &&
				message.tool_calls?.some(
					( toolCall ) =>
						! function_name ||
						toolCall.function.name === function_name
				)
		)
		.map( ( message ) => message.tool_calls );

	const toolCalls = messagesWithToolCalls.reduce(
		( acc, val ) => acc.concat( val ),
		[]
	);

	return toolCalls;
};

/**
 * Extract Tool Outputs from state.
 *
 * @param {*} state The state
 * @return {Array} An array of tool outputs
 */
const getToolOutputs = createSelector(
	( state ) =>
		state.messages
			.filter( ( message ) => message.role === 'tool' )
			.map( ( message ) => ( {
				tool_call_id: message.tool_call_id,
				output: message.content,
			} ) ),
	( state ) => [ state.messages ]
);

const getActiveThreadRun = createSelector(
	( state ) =>
		state.threadRuns.find( ( threadRun ) =>
			THREAD_RUN_ACTIVE_STATUSES.includes( threadRun.status )
		),
	( state ) => [ state.threadRuns ]
);

const shouldSyncToolCalls = ( state ) => {
	// if the service is langgraph-cloud, return true
	return (
		! state.assistantEnabled ||
		state.service === AssistantModelService.LANGGRAPH_CLOUD
	);
};

export const selectors = {
	isEnabled: ( state ) => {
		return state.enabled;
	},
	isAssistantEnabled: ( state ) => {
		return state.assistantEnabled;
	},
	isAutoCreateAssistant: ( state ) => {
		return state.autoCreateAssistant;
	},
	isLoading: ( state ) =>
		state.assistantEnabled && ! selectors.isThreadDataLoaded( state ),
	isRunning: ( state ) =>
		state.isToolRunning ||
		state.isFetchingChatCompletion ||
		state.isCreatingThread ||
		state.isDeletingThread ||
		state.isCreatingThreadRun ||
		state.isFetchingThreadRun ||
		state.isFetchingThreadRuns ||
		state.isCreatingThreadMessage ||
		state.isFetchingThreadMessages ||
		state.isCreatingAssistant ||
		state.isSubmittingToolOutputs,
	isServiceAvailable: ( state ) =>
		state.enabled && ! state.error && state.service && state.apiKey,
	isChatAvailable: ( state ) =>
		selectors.isServiceAvailable( state ) && ! state.assistantEnabled,
	isAssistantAvailable: ( state ) =>
		selectors.isServiceAvailable( state ) &&
		state.assistantEnabled &&
		!! selectors.getAssistantId( state ),
	isAvailable: ( state ) =>
		selectors.isChatAvailable( state ) ||
		selectors.isAssistantAvailable( state ),
	isThreadDataLoaded: ( state ) =>
		! state.assistantEnabled ||
		( state.threadId &&
			state.threadRunsUpdated &&
			state.threadMessagesUpdated ),
	isThreadRunInProgress: ( state ) => {
		return (
			state.threadId &&
			THREAD_RUN_RUNNING_STATUSES.includes(
				selectors.getActiveThreadRunStatus( state )
			)
		);
	},
	isThreadRunComplete: ( state ) => {
		const threadRunStatus = selectors.getActiveThreadRunStatus( state );
		return (
			! selectors.isRunning( state ) &&
			selectors.isThreadDataLoaded( state ) &&
			( ! threadRunStatus ||
				THREAD_RUN_COMPLETED_STATUSES.includes( threadRunStatus ) )
		);
	},
	isAwaitingUserInput: ( state ) =>
		selectors.getPendingToolCalls( state ).length > 0 ||
		selectors.getRunningToolCallIds( state ).length > 0 ||
		selectors.getAssistantMessage( state ),
	isThreadRunAwaitingToolOutputs: ( state ) => {
		const threadRun = getActiveThreadRun( state );
		const requiredToolOutputs = selectors.getRequiredToolOutputs( state );
		return (
			selectors.isThreadDataLoaded( state ) &&
			! selectors.isRunning( state ) &&
			threadRun &&
			threadRun.status === 'requires_action' &&
			threadRun.required_action.type === 'submit_tool_outputs' &&
			requiredToolOutputs.length > 0
		);
	},
	getStream: ( state ) => state.stream,
	getService: ( state ) => state.service,
	getModel: ( state ) => state.model,
	getTemperature: ( state ) => state.temperature,
	getFeature: ( state ) => state.feature,
	getApiKey: ( state ) => state.apiKey,
	getBaseUrl: ( state ) => state.baseUrl,
	getError: ( state ) => state.error,
	getMessages: ( state ) => state.messages,
	getDocuments: ( state ) => state.documents,
	getAssistantMessage: ( state ) => {
		// return the last message only if it's an assistant message with content
		const lastMessage = state.messages[ state.messages.length - 1 ];
		return lastMessage?.role === 'assistant' && lastMessage.content
			? lastMessage.content
			: null;
	},
	getToolOutputs,
	getPendingToolCalls: createSelector(
		( state, function_name = null ) => {
			const toolCalls = getToolCalls( state, function_name );
			const runningToolCalls = selectors.getRunningToolCallIds( state );
			const toolOutputs = getToolOutputs( state );

			const result = toolCalls.filter(
				( toolCall ) =>
					! runningToolCalls.includes( toolCall.id ) &&
					! toolOutputs.some(
						( toolOutput ) =>
							toolOutput.tool_call_id === toolCall.id
					)
			);

			return result;
		},
		( state ) => [ state.messages ]
	),
	getRunningToolCallIds: ( state ) => {
		return state.tool_calls.map( ( tc ) => tc.id );
	},
	getAdditionalMessages: createSelector(
		( state ) => {
			// user/assistant messages without a threadId are considered not to have been synced
			if ( shouldSyncToolCalls( state ) ) {
				return state.messages.filter(
					( message ) => ! message.thread_id
				);
			}
			return state.messages.filter(
				( message ) =>
					[ 'assistant', 'user' ].includes( message.role ) &&
					message.content &&
					! message.thread_id
			);
		},
		( state ) => [ state.messages ]
	),
	getRequiredToolOutputs: createSelector(
		( state ) => {
			const currentThreadRun = state.threadRuns[ 0 ];
			if (
				currentThreadRun &&
				currentThreadRun.status === 'requires_action' &&
				currentThreadRun.required_action.type === 'submit_tool_outputs'
			) {
				return currentThreadRun.required_action.submit_tool_outputs
					.tool_calls;
			}
			return [];
		},
		( state ) => [ state.threadRuns ]
	),
	getThreadId: ( state ) => state.threadId,
	getAssistantId: ( state ) => state.assistantId ?? state.defaultAssistantId,
	getGraphConfig: ( state ) => state.graphConfig,
	getGraphId: ( state ) => state.graphId,
	updateThreadRuns: ( state ) => state.threadRun,
	getThreadRunsUpdated: ( state ) => state.threadRunsUpdated,
	getThreadMessagesUpdated: ( state ) => state.threadMessagesUpdated,
	getActiveThreadRun: createSelector(
		( state ) =>
			state.threadRuns.find( ( threadRun ) =>
				THREAD_RUN_ACTIVE_STATUSES.includes( threadRun.status )
			),
		( state ) => [ state.threadRuns ]
	),
	getActiveThreadRunStatus: createSelector(
		( state ) => getActiveThreadRun( state )?.status,
		( state ) => [ state.threadRuns ]
	),
	getCompletedThreadRuns: createSelector(
		( state ) =>
			state.threadRuns.find( ( threadRun ) =>
				THREAD_RUN_COMPLETED_STATUSES.includes( threadRun.status )
			),
		( state ) => [ state.threadRuns ]
	),
	hasNewMessagesToProcess: ( state ) => {
		const activeThreadRun = getActiveThreadRun( state );
		return (
			activeThreadRun &&
			activeThreadRun.created_at > state.syncedThreadMessagesAt / 1000
		);
	},
};

/*
 * ACTIONS
 */

const addMessage = ( message ) => {
	return {
		type: 'ADD_MESSAGE',
		message: {
			...message,
			id: message.id || uuidv4(),
			created_at: message.created_at || Date.now() / 1000,
		},
	};
};

const agentSay = ( content ) => {
	return addMessage( {
		role: 'assistant',
		content: [
			{
				type: 'text',
				text: content,
			},
		],
	} );
};

const clearMessages = () => ( {
	type: 'SET_MESSAGES',
	messages: [],
} );

const clearError = () => ( {
	type: 'CHAT_ERROR',
	error: null,
} );

export const actions = {
	setEnabled: ( enabled ) => {
		return {
			type: 'SET_ENABLED',
			enabled,
		};
	},
	setError: ( error ) => {
		return {
			type: 'SET_ERROR',
			error,
		};
	},
	setAssistantEnabled: ( enabled ) => {
		return {
			type: 'SET_ASSISTANT_ENABLED',
			enabled,
		};
	},
	setAutoCreateAssistant: ( autoCreateAssistant ) => ( {
		type: 'SET_AUTO_CREATE_ASSISTANT',
		autoCreateAssistant,
	} ),
	setThreadId: ( threadId ) => ( {
		type: 'SET_THREAD_ID',
		threadId,
	} ),
	setAssistantId: ( assistantId ) => ( {
		type: 'SET_ASSISTANT_ID',
		assistantId,
	} ),
	setGraphConfig: ( graphConfig ) => ( {
		type: 'SET_GRAPH_CONFIG',
		graphConfig,
	} ),
	setGraphId: ( graphId ) => ( {
		type: 'SET_GRAPH_ID',
		graphId,
	} ),
	setDefaultAssistantId: ( assistantId ) => ( {
		type: 'SET_DEFAULT_ASSISTANT_ID',
		assistantId,
	} ),
	setStream: ( stream ) => ( {
		type: 'SET_STREAM',
		stream,
	} ),
	setService: ( service ) => ( {
		type: 'SET_SERVICE',
		service,
	} ),
	setApiKey: ( apiKey ) => ( {
		type: 'SET_API_KEY',
		apiKey,
	} ),
	setBaseUrl: ( baseUrl ) => ( {
		type: 'SET_BASE_URL',
		baseUrl,
	} ),
	setFeature: ( feature ) => ( {
		type: 'SET_FEATURE',
		feature,
	} ),
	setSessionId: ( sessionId ) => ( {
		type: 'SET_SESSION_ID',
		sessionId,
	} ),
	setTemperature: ( temperature ) => ( {
		type: 'SET_TEMPERATURE',
		temperature,
	} ),
	setModel: ( model ) => ( {
		type: 'SET_MODEL',
		model,
	} ),
	clearError,
	setToolResult,
	submitToolOutputs,
	runChatCompletion,
	createAssistant,
	createThread,
	deleteThread,
	createThreadRun,
	updateThreadRun,
	updateThreadRuns,
	addMessageToThread,
	updateThreadMessages,
	addMessage,
	agentSay,
	reset,
	clearMessages,
	userSay: ( content, image_urls = [] ) =>
		addMessage( {
			role: 'user',
			id: uuidv4(),
			content: [
				{
					type: 'text',
					text: content,
				},
				...image_urls?.map( ( image_url ) => ( {
					type: 'image_url',
					image_url, //: 'data:image/jpeg;base64,$base64'
				} ) ),
			],
		} ),
	call: ( name, args, id ) => ( {
		type: 'ADD_MESSAGE',
		message: {
			id: uuidv4(),
			created_at: Date.now() / 1000,
			role: 'assistant',
			tool_calls: [
				{
					id: id ?? uuidv4(),
					type: 'function',
					function: {
						name,
						arguments: JSON.stringify( args ),
					},
				},
			],
		},
	} ),
};

export const slice = {
	reducer,
	actions,
	selectors,
};

export function createChatStore( name, defaultValues ) {
	console.warn( 'createChatStore', name, defaultValues );
	return createReduxStore( name, {
		reducer,
		actions,
		selectors,
		initialState: { ...initialState, ...defaultValues },
	} );
}
