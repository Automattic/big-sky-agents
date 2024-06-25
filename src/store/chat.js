import uuidv4 from '../utils/uuid.js';
import ChatModel from '../agents/chat-model.js';
import AssistantModel from '../agents/assistant-model.js';

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
	// LLM related
	model: null,
	service: null,
	temperature: null,
	apiKey: null,

	// Assistants-API-related
	assistantId: null, // The assistant ID
	threadId: localStorage.getItem( 'threadId' ) || null, // The assistant thread ID
	threadRuns: [], // The Assistant thread runs
	threadRunsUpdated: null, // The last time the thread runs were updated
	threadMessagesUpdated: null, // The last time Assistant messages were updated
	syncedThreadMessagesAt: null, // The last time synced messages were updated

	// Chat-API-related
	messages: [],
	isToolRunning: false,
	isFetchingChatCompletion: false,
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
				content.text = content.text?.value;
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
function filterHistoryMessage( message ) {
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
				content.text = content.text.value;
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
 * These controls allow an async request to fetch the token
 */
export const controls = {
	async RESOLVE_TOOL_CALL_RESULT( { promise } ) {
		return await promise;
	},
	async CHAT_CALL( { service, apiKey, request } ) {
		const chatModel = ChatModel.getInstance( service, apiKey );
		return await chatModel.run( request );
	},
	async CREATE_THREAD_CALL( { service, apiKey } ) {
		// @see: https://platform.openai.com/docs/api-reference/threads/createThread
		const assistantModel = AssistantModel.getInstance( service, apiKey );
		return await assistantModel.createThread();
	},
	async DELETE_THREAD_CALL( { service, apiKey, threadId } ) {
		const assistantModel = AssistantModel.getInstance( service, apiKey );
		return await assistantModel.deleteThread( threadId );
	},
	async RUN_THREAD_CALL( { service, apiKey, request } ) {
		const assistantModel = AssistantModel.getInstance( service, apiKey );
		return await assistantModel.createThreadRun( {
			...request,
			additionalMessages: request.additionalMessages?.map(
				chatMessageToThreadMessage
			),
		} );
	},
	async GET_THREAD_RUNS_CALL( { service, apiKey, threadId } ) {
		const assistantModel = AssistantModel.getInstance( service, apiKey );
		return await assistantModel.getThreadRuns( threadId );
	},
	async GET_THREAD_RUN_CALL( { service, apiKey, threadId, threadRunId } ) {
		const assistantModel = AssistantModel.getInstance( service, apiKey );
		return await assistantModel.getThreadRun( threadId, threadRunId );
	},
	async GET_THREAD_MESSAGES_CALL( { service, apiKey, threadId } ) {
		const assistantModel = AssistantModel.getInstance( service, apiKey );
		return await assistantModel.getThreadMessages( threadId );
	},
	async CREATE_THREAD_MESSAGE_CALL( { service, apiKey, threadId, message } ) {
		const assistantModel = AssistantModel.getInstance( service, apiKey );
		// filter message to just role, content, attachments and metadata
		return await assistantModel.createThreadMessage( threadId, message );
	},
	async SUBMIT_TOOL_OUTPUTS_CALL( {
		service,
		apiKey,
		threadId,
		threadRunId,
		toolOutputs,
	} ) {
		const assistantModel = AssistantModel.getInstance( service, apiKey );
		return await assistantModel.submitToolOutputs(
			threadId,
			threadRunId,
			toolOutputs
		);
	},
};

/**
 * Reset the state of the chat.
 *
 * @param {Object} options
 * @param {string} options.service
 * @param {string} options.apiKey
 * @param {string} options.threadId
 * @return {Object} Yields the resulting actions
 */
function* reset( { service, apiKey, threadId } ) {
	yield clearMessages();
	yield clearError();
	if ( service && apiKey && threadId ) {
		yield runDeleteThread( { service, apiKey, threadId } );
	}
}

/**
 * Make a Chat Completion call
 *
 * @param {Object}        request
 * @param {string}        request.service
 * @param {string}        request.apiKey
 * @param {string}        request.model
 * @param {number}        request.temperature
 * @param {number}        request.maxTokens
 * @param {Array<Object>} request.messages
 * @param {Array<Object>} request.tools
 * @param {Object}        request.instructions
 * @param {Object}        request.additionalInstructions
 * @param {string}        request.feature
 */
function* runChatCompletion( { service, apiKey, ...request } ) {
	yield { type: 'CHAT_BEGIN_REQUEST' };
	try {
		const assistantMessage = yield {
			type: 'CHAT_CALL',
			service,
			apiKey,
			request,
		};
		yield actions.addMessage( assistantMessage );
		yield { type: 'CHAT_END_REQUEST' };
	} catch ( error ) {
		console.error( 'Chat error', error );
		return { type: 'CHAT_ERROR', error: error.message };
	}
}

/**
 * Get the thread runs for a given thread.
 *
 * @param {*}      options
 * @param {string} options.service
 * @param {string} options.apiKey
 * @param {string} options.threadId
 * @return {Object} Yields the resulting actions
 */
function* runGetThreadRuns( { service, apiKey, threadId } ) {
	yield { type: 'GET_THREAD_RUNS_BEGIN_REQUEST' };
	try {
		const threadRunsResponse = yield {
			type: 'GET_THREAD_RUNS_CALL',
			service,
			apiKey,
			threadId,
		};
		yield {
			type: 'GET_THREAD_RUNS_END_REQUEST',
			ts: Date.now(),
			threadRuns: threadRunsResponse.data,
		};
	} catch ( error ) {
		console.error( 'Get Thread Runs Error', error );
		return { type: 'GET_THREAD_RUNS_ERROR', error: error.message };
	}
}

/**
 * Get a thread run for a given thread.
 *
 * @param {Object} options
 * @param {string} options.service
 * @param {string} options.apiKey
 * @param {string} options.threadId
 * @param {string} options.threadRunId
 * @return  {Object} Yields the resulting actions
 */
function* runGetThreadRun( { service, apiKey, threadId, threadRunId } ) {
	yield { type: 'GET_THREAD_RUN_BEGIN_REQUEST' };
	try {
		const threadRun = yield {
			type: 'GET_THREAD_RUN_CALL',
			service,
			apiKey,
			threadId,
			threadRunId,
		};
		yield {
			type: 'GET_THREAD_RUN_END_REQUEST',
			threadRun,
		};
	} catch ( error ) {
		console.error( 'Thread error', error );
		return { type: 'GET_THREAD_RUN_ERROR', error: error.message };
	}
}

/**
 * Get the thread messages for a given thread.
 *
 * @param {Object} options
 * @param {string} options.service
 * @param {string} options.apiKey
 * @param {string} options.threadId
 * @return  {Object} Yields the resulting actions
 */
function* runGetThreadMessages( { service, apiKey, threadId } ) {
	yield { type: 'GET_THREAD_MESSAGES_BEGIN_REQUEST' };
	try {
		const threadMessagesResponse = yield {
			type: 'GET_THREAD_MESSAGES_CALL',
			service,
			apiKey,
			threadId,
		};
		yield {
			type: 'GET_THREAD_MESSAGES_END_REQUEST',
			ts: Date.now(),
			threadMessages: threadMessagesResponse.data,
		};
	} catch ( error ) {
		console.error( 'Get Thread Messages Error', error );
		return { type: 'GET_THREAD_MESSAGES_ERROR', error: error.message };
	}
}

/**
 * Create a new thread.
 *
 * @param {Object} options         The options for the thread
 * @param {string} options.service The service URL
 * @param {string} options.apiKey  The API key
 * @return {Object} Yields the resulting actions
 */
function* runCreateThread( { service, apiKey } ) {
	yield { type: 'CREATE_THREAD_BEGIN_REQUEST' };
	try {
		const threadResponse = yield {
			type: 'CREATE_THREAD_CALL',
			service,
			apiKey,
		};
		return {
			type: 'CREATE_THREAD_END_REQUEST',
			threadId: threadResponse.id,
		};
	} catch ( error ) {
		console.error( 'Thread error', error );
		return { type: 'CREATE_THREAD_ERROR', error: error.message };
	}
}

/**
 * Delete a thread.
 *
 * @param {Object} options          The options for the thread
 * @param {string} options.service  The service URL
 * @param {string} options.apiKey   The API key
 * @param {string} options.threadId The thread ID
 * @return {Object} Yields the resulting actions
 */
function* runDeleteThread( { service, apiKey, threadId } ) {
	yield { type: 'DELETE_THREAD_BEGIN_REQUEST' };
	try {
		yield {
			type: 'DELETE_THREAD_CALL',
			service,
			apiKey,
			threadId,
		};
		yield {
			type: 'DELETE_THREAD_END_REQUEST',
		};
	} catch ( error ) {
		console.error( 'Thread error', error );
		return { type: 'DELETE_THREAD_ERROR', error: error.message };
	}
}

/**
 * Create a new thread run.
 *
 * @param {Object} options
 * @param {string} options.service
 * @param {string} options.apiKey
 * @param {string} options.threadId
 * @param {Object} options.assistantId
 * @param {string} options.model
 * @param {string} options.instructions
 * @param {string} options.additionalInstructions
 * @param {Array}  options.additionalMessages
 * @param {Array}  options.tools
 * @param {Array}  options.metadata
 * @param {number} options.temperature
 * @param {number} options.maxPromptTokens
 * @param {number} options.maxCompletionTokens
 * @param {Object} options.truncationStrategy
 * @param {Object} options.responseFormat
 * @return {Object} Yields the resulting actions
 */
function* runCreateThreadRun( { service, apiKey, ...request } ) {
	yield { type: 'RUN_THREAD_BEGIN_REQUEST' };
	try {
		const runCreateThreadRunResponse = yield {
			type: 'RUN_THREAD_CALL',
			service,
			apiKey,
			request,
		};
		yield {
			type: 'RUN_THREAD_END_REQUEST',
			ts: Date.now(),
			additionalMessages: request.additionalMessages,
			threadRun: runCreateThreadRunResponse,
		};
	} catch ( error ) {
		console.error( 'Run Thread Error', error );
		return { type: 'RUN_THREAD_ERROR', error: error.message };
	}
}

/**
 * Submit tool outputs for a given thread run.
 *
 * @param {Object} options
 * @param {string} options.service
 * @param {string} options.apiKey
 * @param {string} options.threadId
 * @param {string} options.threadRunId
 * @param {Array}  options.toolOutputs
 * @return {Object} Yields the resulting actions
 */
function* runSubmitToolOutputs( {
	service,
	apiKey,
	threadId,
	threadRunId,
	toolOutputs,
} ) {
	try {
		yield {
			type: 'SUBMIT_TOOL_OUTPUTS_BEGIN_REQUEST',
		};
		const updatedRun = yield {
			type: 'SUBMIT_TOOL_OUTPUTS_CALL',
			service,
			apiKey,
			threadId,
			threadRunId,
			toolOutputs,
		};
		return {
			type: 'SUBMIT_TOOL_OUTPUTS_END_REQUEST',
			threadRun: updatedRun,
		};
	} catch ( error ) {
		console.error( 'Submit Tool Outputs Error', error );
		return {
			type: 'SUBMIT_TOOL_OUTPUTS_ERROR',
			error: error.message,
		};
	}
}

/**
 * Set the result of a tool call, and if it's a promise then resolve it first.
 *
 * @param {number} toolCallId
 * @param {*}      promise
 * @return {Object} The resulting action
 */
function* setToolCallResult( toolCallId, promise ) {
	yield { type: 'TOOL_BEGIN_REQUEST' };
	try {
		const result = yield { type: 'RESOLVE_TOOL_CALL_RESULT', promise };
		return {
			type: 'TOOL_END_REQUEST',
			id: uuidv4(),
			tool_call_id: toolCallId,
			result,
		};
	} catch ( error ) {
		return {
			type: 'TOOL_ERROR',
			id: toolCallId,
			error: error.message || 'There was an error',
		};
	}
}

function* runAddMessageToThread( { message, threadId, service, apiKey } ) {
	// add the message to the active thread
	if ( ! message.id ) {
		throw new Error( 'Message must have an ID' );
	}
	yield { type: 'CREATE_THREAD_MESSAGE_BEGIN_REQUEST' };
	try {
		const newMessage = yield {
			type: 'CREATE_THREAD_MESSAGE_CALL',
			service,
			apiKey,
			threadId,
			message: chatMessageToThreadMessage( message ),
		};
		yield {
			type: 'CREATE_THREAD_MESSAGE_END_REQUEST',
			ts: Date.now(),
			originalMessageId: message.id,
			message: newMessage,
		};
	} catch ( error ) {
		console.error( 'Create thread error', error );
		return {
			type: 'CREATE_THREAD_MESSAGE_ERROR',
			error: error.message,
		};
	}
}

/**
 * REDUCERS
 */

const addMessageReducer = ( state, message ) => {
	message = filterHistoryMessage( message );

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
		const existingToolCallMessage = state.messages.find( ( callMessage ) => {
			return (
				callMessage.role === 'assistant' &&
				callMessage.tool_calls?.some(
					( toolCall ) => toolCall.id === message.tool_call_id
				)
			);
		} );

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
				isToolRunning: true,
			};
		case 'TOOL_END_REQUEST':
			return {
				...addMessageReducer( state, {
					role: 'tool',
					id: action.id,
					tool_call_id: action.tool_call_id,
					content: action.result,
				} ),
				error: null,
				isToolRunning: false,
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
			};

		// Add and Clear Messages
		case 'ADD_MESSAGE':
			return addMessageReducer( state, action.message );
		case 'CLEAR_MESSAGES':
			return { ...state, messages: [] };

		/**
		 * Assistant-related reducers
		 */

		// Set Assistant ID
		case 'SET_ASSISTANT_ID':
			return {
				...state,
				assistantId: action.assistantId,
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
							return action.message;
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
			const additionalMessageIds = action.additionalMessages?.map(
				( message ) => message.id
			);

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
				const assistantMessage = {
					role: 'assistant',
					tool_calls,
				};
				state = addMessageReducer( state, assistantMessage );
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
const getToolOutputs = ( state ) => {
	return state.messages
		.filter( ( message ) => message.role === 'tool' )
		.map( ( message ) => ( {
			tool_call_id: message.tool_call_id,
			output: message.content,
		} ) );
};

export const selectors = {
	isLoading: ( state ) => {
		// TODO: check most recent message against when the thread messages were updated
		const isLoading =
			state.threadId &&
			( ! state.threadRunsUpdated || ! state.threadMessagesUpdated );
		return isLoading;
	},
	// if we have at least one message in history, we have started
	isStarted: ( state ) => state.messages.length > 0,
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

		const toolOutputs = getToolOutputs( state );

		const result = toolCalls.filter(
			( toolCall ) =>
				! toolOutputs.some(
					( toolOutput ) => toolOutput.tool_call_id === toolCall.id
				)
		);

		return result;
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
	getRequiredToolOutputs: ( state ) => {
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
	getThreadId: ( state ) => state.threadId,
	getAssistantId: ( state ) => state.assistantId,
	getThreadRuns: ( state ) => state.threadRun,
	getThreadRunsUpdated: ( state ) => state.threadRunsUpdated,
	getThreadMessagesUpdated: ( state ) => state.threadMessagesUpdated,
	getActiveThreadRun: ( state ) => {
		return state.threadRuns.find( ( threadRun ) =>
			THREAD_RUN_ACTIVE_STATUSES.includes( threadRun.status )
		);
	},
	getCompletedThreadRuns: ( state ) => {
		return state.threadRuns.find( ( threadRun ) =>
			THREAD_RUN_COMPLETED_STATUSES.includes( threadRun.status )
		);
	},
	hasNewMessagesToProcess: ( state ) => {
		// compare threadRun.created_at to syncedThreadMessagesAt / 1000
		const activeThreadRun = selectors.getActiveThreadRun( state );
		if ( ! activeThreadRun ) {
			return false;
		}
		const activeThreadRunCreatedAt = activeThreadRun.created_at;
		const syncedThreadMessagesAt = state.syncedThreadMessagesAt;
		return activeThreadRunCreatedAt > syncedThreadMessagesAt / 1000;
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
		},
	};
};

const clearMessages = () => ( {
	type: 'CLEAR_MESSAGES',
} );

const clearError = () => ( {
	type: 'CHAT_ERROR',
	error: null,
} );

export const actions = {
	setThreadId: ( threadId ) => ( {
		type: 'SET_THREAD_ID',
		threadId,
	} ),
	setAssistantId: ( assistantId ) => ( {
		type: 'SET_ASSISTANT_ID',
		assistantId,
	} ),
	clearError,
	setToolCallResult,
	runSubmitToolOutputs,
	runChatCompletion,
	runCreateThread,
	runDeleteThread,
	runCreateThreadRun,
	runGetThreadRun,
	runGetThreadRuns,
	runAddMessageToThread,
	runGetThreadMessages,
	addMessage,
	reset,
	clearMessages,
	addUserMessage: ( content, image_urls = [] ) =>
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
	addToolCall: ( name, args, id ) => ( {
		type: 'ADD_MESSAGE',
		message: {
			id: uuidv4(),
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
