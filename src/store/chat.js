import { createReduxStore, createSelector } from '@wordpress/data';
import uuidv4 from '../utils/uuid.js';
import ChatModel from '../ai/chat-model.js';
import AssistantModel from '../ai/assistant-model.js';
import { actions as agentsActions } from './agents.js';

export const THREAD_RUN_ACTIVE_STATUSES = [
	'queued',
	'in_progress',
	'requires_action',
	'cancelling',
	'completed',
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

export const THREAD_RUN_COMPLETED_STATUSES = [
	// 'cancelled',
	// 'failed',
	'completed',
];

const initialState = {
	// Global
	error: null,
	enabled: true,
	assistantEnabled: false,
	feature: 'unknown',

	// LLM related
	model: null,
	service: null,
	temperature: 0.1,
	apiKey: null,

	// Chat-API-related
	messages: [],
	tool_calls: [],
	isToolRunning: false,
	isFetchingChatCompletion: false,

	// Assistants-API-related
	assistantId: null, // The assistant ID
	defaultAssistantId: null, // The default assistant ID
	threadId: localStorage.getItem( 'threadId' ) || null, // The assistant thread ID
	threadRuns: [], // The Assistant thread runs
	threadRunsUpdated: null, // The last time the thread runs were updated
	threadMessagesUpdated: null, // The last time Assistant messages were updated
	syncedThreadMessagesAt: null, // The last time synced messages were updated
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
		role: message.role,
		content: filteredContent,
		// These aren't supported in Big Sky Agents yet
		// attachments: message.attachments,
		// metadata: message.metadata,
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
	let filteredToolCalls = message.tool_calls;

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

	if ( message.role === 'assistant' && filteredToolCalls ) {
		// replace with message.map rather than modifying in-place
		filteredToolCalls = message.tool_calls.map( ( toolCall ) => ( {
			...toolCall,
			function: {
				...toolCall.function,
				arguments:
					typeof toolCall.function?.arguments === 'string'
						? JSON.parse( toolCall.function.arguments )
						: toolCall.function.arguments,
			},
		} ) );
	}

	return {
		...message,
		tool_calls: filteredToolCalls,
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
			dispatch( deleteThread() );
		}
	};

const getChatModel = ( select ) => {
	const { service, apiKey, feature } = select( ( state ) => ( {
		service: state.root.service,
		apiKey: state.root.apiKey,
		feature: state.root.feature,
	} ) );
	if ( ! service || ! apiKey ) {
		throw new Error( 'Service and API key are required' );
	}
	return ChatModel.getInstance( service, apiKey, feature );
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
		const { model, temperature, messages, feature } = select( ( state ) => {
			return {
				model: state.root.model,
				temperature: state.root.temperature,
				messages: state.root.messages,
				feature: state.root.feature,
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
			const assistantMessage = await getChatModel( select ).run( {
				...request,
				messages,
				model,
				temperature,
				feature,
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
			return { type: 'GET_THREAD_RUNS_ERROR', error: error.message };
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
			return { type: 'GET_THREAD_RUN_ERROR', error: error.message };
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
			} );
		} catch ( error ) {
			console.error( 'Get Thread Messages Error', error );
			return { type: 'GET_THREAD_MESSAGES_ERROR', error: error.message };
		}
	};

const getAssistantModel = ( select ) => {
	const { service, apiKey, assistantId, feature } = select( ( state ) => ( {
		service: state.root.service,
		apiKey: state.root.apiKey,
		assistantId: selectors.getAssistantId( state.root ),
		feature: state.root.feature,
	} ) );
	if ( ! service || ! apiKey || ! assistantId ) {
		console.warn( 'Service, API key and assistant ID are required', {
			service,
			apiKey,
			assistantId,
		} );
		throw new Error( 'Service, API key and assistant ID are required' );
	}
	return AssistantModel.getInstance( service, apiKey, feature );
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
			dispatch( {
				type: 'CREATE_THREAD_END_REQUEST',
				threadId: threadResponse.id,
			} );
		} catch ( error ) {
			console.error( 'Thread error', error );
			return { type: 'CREATE_THREAD_ERROR', error: error.message };
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
			console.error( 'Thread error', error );
			return { type: 'DELETE_THREAD_ERROR', error: error.message };
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
		const { threadId, assistantId, model, temperature } = select(
			( state ) => ( {
				threadId: state.root.threadId,
				assistantId: selectors.getAssistantId( state.root ),
				model: state.root.model,
				temperature: state.root.temperature,
			} )
		);
		dispatch( { type: 'RUN_THREAD_BEGIN_REQUEST' } );
		try {
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
			console.error( 'Create thread error', error );
			return {
				type: 'CREATE_THREAD_MESSAGE_ERROR',
				error: error.message,
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
		return {
			...state,
			messages: [
				...state.messages.slice( 0, existingMessageIndex ),
				message,
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
			console.warn( 'tool call result already exists', message );
			return state;
		}

		// find the tool call message and insert the result after it
		const existingToolCallMessage = state.messages.find(
			( callMessage ) => {
				return (
					callMessage.role === 'assistant' &&
					callMessage.tool_calls?.some(
						( toolCall ) => toolCall.id === message.tool_call_id
					)
				);
			}
		);

		if ( existingToolCallMessage ) {
			const index = state.messages.indexOf( existingToolCallMessage );
			// add this message to the messages list, and remove the existing tool call
			return {
				...state,
				messages: [
					...state.messages.slice( 0, index + 1 ),
					message,
					...state.messages.slice( index + 1 ),
				],
			};
		}
		console.error(
			'could not find call message for tool result',
			message,
			existingToolCallMessage
		);
		throw new Error(
			`Could not find tool call message for tool call ID ${ message.tool_call_id }`
		);
	}

	return {
		...state,
		messages: [ ...state.messages, message ],
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

export const reducer = ( state = initialState, action ) => {
	switch ( action.type ) {
		// LLM-related
		case 'SET_ENABLED':
			return { ...state, enabled: action.enabled };
		case 'SET_ASSISTANT_ENABLED':
			return { ...state, assistantEnabled: action.enabled };
		case 'SET_SERVICE':
			return { ...state, service: action.service };
		case 'SET_API_KEY':
			return { ...state, apiKey: action.apiKey };
		case 'SET_FEATURE':
			return { ...state, feature: action.feature };
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
		case 'TOOL_END_REQUEST':
			return {
				...addMessageReducer( state, {
					role: 'tool',
					id: action.id,
					created_at: action.ts,
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
		case 'SET_MESSAGES':
			return { ...state, messages: action.messages };

		/**
		 * Assistant-related reducers
		 */

		// Set Assistant ID
		case 'SET_ASSISTANT_ID':
			return {
				...state,
				assistantId: action.assistantId,
			};
		case 'SET_DEFAULT_ASSISTANT_ID':
			return {
				...state,
				defaultAssistantId: action.assistantId,
			};

		// Set Thread
		case 'SET_THREAD_ID':
			return setThreadIdReducer( state, action.threadId );

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
			return { ...state, isDeletingThread: false, error: action.error };

		// Create Thread Message
		case 'CREATE_THREAD_MESSAGE_BEGIN_REQUEST':
			return { ...state, isCreatingThreadMessage: true };
		case 'CREATE_THREAD_MESSAGE_END_REQUEST':
			// set synced to true on the message with the matching id
			return {
				...state,
				messages: [
					...state.messages.map( ( message ) => {
						if ( message.id === action.originalMessageId ) {
							return filterChatMessage( action.message );
						}
						return message;
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
				action.additionalMessages?.map( ( message ) => message.id ) ??
				[];

			return {
				...state,
				// for each message in action.additionalMessages, find them by id and set message.thread_id to action.threadRun.id
				messages: state.messages.map( ( message ) => {
					if ( additionalMessageIds.includes( message.id ) ) {
						return {
							...message,
							thread_id: state.threadId,
						};
					}
					return message;
				} ),
				isCreatingThreadRun: false,
				threadRunsUpdated: action.ts,
				threadMessagesUpdated: null, // force reloading of chat history
				threadRuns: [ action.threadRun, ...state.threadRuns ],
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
			// check if action.threadRun has pending tool calls
			const { threadRun } = action;

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
					role: 'assistant',
					created_at: action.ts,
					tool_calls,
				} );
			}
			const existingThreadRunIndex = state.threadRuns.findIndex(
				( tr ) => tr.id === action.threadRun.id
			);
			if ( existingThreadRunIndex !== -1 ) {
				state.threadRuns[ existingThreadRunIndex ] = action.threadRun;
			} else {
				state.threadRuns = [
					...state.threadRuns.filter(
						( tr ) => tr.id !== action.threadRun.id
					),
					action.threadRun,
				];
			}
			return {
				...state,
				threadMessagesUpdated: null,
				isFetchingThreadRun: false,
			};
		case 'GET_THREAD_RUN_ERROR':
			return {
				...state,
				isFetchingThreadRun: false,
				error: action.error,
			};

		// Get All Thread Runs
		case 'GET_THREAD_RUNS_BEGIN_REQUEST':
			return { ...state, isFetchingThreadRuns: true };
		case 'GET_THREAD_RUNS_END_REQUEST':
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
				...state,
				isFetchingThreadRuns: false,
				error: action.error,
			};

		// Get Thread Messages
		case 'GET_THREAD_MESSAGES_BEGIN_REQUEST':
			return { ...state, isFetchingThreadMessages: true };
		case 'GET_THREAD_MESSAGES_END_REQUEST':
			// use addMessageReducer( state, message ) to add each message to the history
			// and update the tool_calls
			action.threadMessages.reverse().forEach( ( message ) => {
				// if the message is already in the history, update it
				state = addMessageReducer( state, message );
			} );
			return {
				...state,
				isFetchingThreadMessages: false,
				threadMessagesUpdated: action.ts,
			};
		case 'GET_THREAD_MESSAGES_ERROR':
			return {
				...state,
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

export const selectors = {
	isEnabled: ( state ) => {
		return state.enabled;
	},
	isAssistantEnabled: ( state ) => {
		return state.assistantEnabled;
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
		state.isSubmittingToolOutputs,
	isServiceAvailable: ( state ) =>
		state.enabled && ! state.error && state.service && state.apiKey,
	isChatAvailable: ( state ) =>
		selectors.isServiceAvailable( state ) && ! state.assistantEnabled,
	isAssistantAvailable: ( state ) =>
		selectors.isServiceAvailable( state ) &&
		state.assistantEnabled &&
		selectors.getAssistantId( state ),
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
			[ 'queued', 'in_progress' ].includes(
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
	getService: ( state ) => state.service,
	getModel: ( state ) => state.model,
	getTemperature: ( state ) => state.temperature,
	getFeature: ( state ) => state.feature,
	getApiKey: ( state ) => state.apiKey,
	getError: ( state ) => state.error,
	getMessages: ( state ) => state.messages,
	getAssistantMessage: ( state ) => {
		// return the last message only if it's an assistant message with content
		const lastMessage = state.messages[ state.messages.length - 1 ];
		return lastMessage?.role === 'assistant' && lastMessage.content
			? lastMessage.content
			: null;
	},
	getToolOutputs,
	getPendingToolCalls: ( state, function_name = null ) => {
		const toolCalls = getToolCalls( state, function_name );
		const runningToolCalls = selectors.getRunningToolCallIds( state );
		const toolOutputs = getToolOutputs( state );

		const result = toolCalls.filter(
			( toolCall ) =>
				! runningToolCalls.includes( toolCall.id ) &&
				! toolOutputs.some(
					( toolOutput ) => toolOutput.tool_call_id === toolCall.id
				)
		);

		return result;
	},
	getRunningToolCallIds: ( state ) => {
		return state.tool_calls.map( ( tc ) => tc.id );
	},
	getAdditionalMessages: ( state ) => {
		// user/assistant messages without a threadId are considered not to have been synced
		return state.messages.filter(
			( message ) =>
				[ 'assistant', 'user' ].includes( message.role ) &&
				message.content &&
				! message.thread_id
		);
	},
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
			created_at: message.created_at || Date.now(),
		},
	};
};

const addAssistantMessage = ( content ) => {
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
	setAssistantEnabled: ( enabled ) => {
		return {
			type: 'SET_ASSISTANT_ENABLED',
			enabled,
		};
	},
	setThreadId: ( threadId ) => ( {
		type: 'SET_THREAD_ID',
		threadId,
	} ),
	setAssistantId: ( assistantId ) => ( {
		type: 'SET_ASSISTANT_ID',
		assistantId,
	} ),
	setDefaultAssistantId: ( assistantId ) => ( {
		type: 'SET_DEFAULT_ASSISTANT_ID',
		assistantId,
	} ),
	setService: ( service ) => ( {
		type: 'SET_SERVICE',
		service,
	} ),
	setApiKey: ( apiKey ) => ( {
		type: 'SET_API_KEY',
		apiKey,
	} ),
	setFeature: ( feature ) => ( {
		type: 'SET_FEATURE',
		feature,
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
	createThread,
	deleteThread,
	createThreadRun,
	updateThreadRun,
	updateThreadRuns,
	addMessageToThread,
	updateThreadMessages,
	addMessage,
	addAssistantMessage,
	reset,
	clearMessages,
	userSay: ( content, image_urls = [] ) =>
		addMessage( {
			role: 'user',
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
			created_at: Date.now(),
			role: 'assistant',
			tool_calls: [
				{
					id: id ?? uuidv4(),
					type: 'function',
					function: {
						name,
						arguments: args,
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
