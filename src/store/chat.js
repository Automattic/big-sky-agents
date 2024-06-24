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
	// Assistants-API-related
	assistantId: null, // The assistant ID
	threadId: localStorage.getItem( 'threadId' ) || null, // The assistant thread ID
	threadRuns: [], // The Assistant thread runs
	threadRunsUpdated: null, // The last time the thread runs were updated
	threadMessagesUpdated: null, // The last time Assistant messages were updated
	syncedThreadMessagesAt: null, // The last time synced messages were updated

	// Chat-API-related
	history: [],
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
		// an assistant tool call message usually has no content, but this is invalid in thie assistant API
	} else if ( ! filteredContent.length && message.tool_calls ) {
		filteredContent = [
			{
				type: 'text',
				text:
					'Invoked tool calls: ' +
					message.tool_calls
						.map( ( toolCall ) => toolCall.function.name )
						.join( ', ' ),
			},
		];
	}

	return {
		role: message.role,
		content: filteredContent,
		attachments: message.attachments,
		metadata: message.metadata,
	};
};

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
		return await assistantModel.createThreadRun( request );
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

		// we need to do a silly hack because gpt-4o repeats call IDs
		// if the message has tool calls, set each ID to uuidv4() to avoid OpenAI repeated UUID bugs
		yield actions.addMessage( {
			...assistantMessage,
			tool_calls: assistantMessage.tool_calls?.map( ( toolCall ) => ( {
				...toolCall,
				id: uuidv4(),
			} ) ),
		} );
		yield { type: 'CHAT_END_REQUEST' };
	} catch ( error ) {
		console.error( 'Chat error', error );
		debugger;
		return { type: 'CHAT_ERROR', error: error.message };
	}
}

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
			threadRuns: threadRunsResponse.data,
		};
	} catch ( error ) {
		console.error( 'Thread error', error );
		return { type: 'GET_THREAD_RUNS_ERROR', error: error.message };
	}
}

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
			threadMessages: threadMessagesResponse.data,
		};
	} catch ( error ) {
		console.error( 'Thread error', error );
		return { type: 'GET_THREAD_MESSAGES_ERROR', error: error.message };
	}
}

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
			additionalMessages: request.additionalMessages,
			threadRun: runCreateThreadRunResponse,
		};
	} catch ( error ) {
		console.error( 'Run thread error', error );
		debugger;
		return { type: 'RUN_THREAD_ERROR', error: error.message };
	}
}

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
		yield {
			type: 'SUBMIT_TOOL_OUTPUTS_END_REQUEST',
			threadRun: updatedRun,
		};
	} catch ( error ) {
		console.error( 'Tool error', error );
		debugger;
		return {
			type: 'SUBMIT_TOOL_OUTPUTS_ERROR',
			error: error.message,
		};
	}
}

/**
 * Set the result of a tool call, and if it's a promise then resolve it first
 * @param {number} toolCallId
 * @param {*}      promise
 * @param {string} threadId
 * @param {string} threadRunId
 * @param {string} service
 * @param {string} apiKey
 * @return {Object} The resulting action
 */
function* setToolCallResult( toolCallId, promise ) {
	yield { type: 'TOOL_BEGIN_REQUEST' };
	try {
		const result = yield { type: 'RESOLVE_TOOL_CALL_RESULT', promise };
		return { type: 'TOOL_END_REQUEST', id: toolCallId, result };
	} catch ( error ) {
		return {
			type: 'TOOL_ERROR',
			id: toolCallId,
			error: error.message,
		};
	}
}

function filterMessage( message ) {
	let filteredContent = message.content;

	if ( typeof filteredContent === 'undefined' || filteredContent === null ) {
		filteredContent = '';
	}
	// the message.content is sometimes an array like this:
	// [{ type: 'text', text: { annotations: [], value: 'foo' }}]
	// it needs to be transformed to this:
	// [{ type: 'text', text: 'foo' }]
	// TODO: do the same thing when syncing back to the assistant API
	if ( Array.isArray( filteredContent ) ) {
		message = {
			...message,
			content: filteredContent.map( ( content ) => {
				if (
					content.type === 'text' &&
					typeof content.text?.value === 'string'
				) {
					content.text = content.text.value;
				}
				return content;
			} ),
		};
	}

	if ( message.role === 'assistant' && message.tool_calls ) {
		// replace with message.map rather than modifying in-place
		message = {
			...message,
			tool_calls: message.tool_calls.map( ( toolCall ) => ( {
				...toolCall,
				id: toolCall.id || uuidv4(),
				function: {
					...toolCall.function,
					arguments:
						typeof toolCall.function?.arguments === 'string'
							? JSON.parse( toolCall.function.arguments )
							: toolCall.function.arguments,
				},
			} ) ),
		};
	}

	return {
		...message,
		created_at: message.created_at || Date.now(),
		id: message.id || uuidv4(),
		content: filteredContent,
	};
}

const addMessage = ( message ) => {
	return {
		type: 'ADD_MESSAGE',
		message,
	};
};

function* runAddMessageToThread( { message, threadId, service, apiKey } ) {
	// add the message to the active thread
	console.warn( 'Adding message to thread', message );
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
			originalMessageId: message.id,
			message: newMessage,
		};
	} catch ( error ) {
		console.error( 'Create thread error', error );
		debugger;
		return {
			type: 'CREATE_THREAD_MESSAGE_ERROR',
			error: error.message,
		};
	}
}

function* addUserMessage( content, image_urls = [] ) {
	const message = {
		role: 'user',
		id: uuidv4(),
		created_at: Math.floor( Date.now() / 1000 ),
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
	};

	yield addMessage( message );
}

const addMessageReducer = ( state, message ) => {
	message = filterMessage( message );

	console.warn( 'adding message', message );

	// if the message has the same ID as an existing message, update it
	const existingMessageIndex = state.history.findIndex(
		( existingMessage ) => existingMessage.id === message.id
	);

	if ( existingMessageIndex !== -1 ) {
		state.history[ existingMessageIndex ] = message;
		return state;
	}

	// special processing for tools - add the tool call messages
	if ( message.role === 'tool' && message.tool_call_id ) {
		console.warn( 'Recording tool message', message );
		// if there's an existing tool call result for this tool call ID, don't add it
		const existingToolCallResultMessage = state.history.find(
			( existingMessage ) =>
				existingMessage.role === 'tool' &&
				existingMessage.tool_call_id === message.tool_call_id
		);

		if ( existingToolCallResultMessage ) {
			console.warn( 'tool call result already exists', message );
			return state;
		}

		// find the tool call message and insert the result after it
		const existingToolCallMessage = state.history.find( ( callMessage ) => {
			return (
				callMessage.role === 'assistant' &&
				callMessage.tool_calls?.some(
					( toolCall ) => toolCall.id === message.tool_call_id
				)
			);
		} );

		if ( existingToolCallMessage ) {
			const index = state.history.indexOf( existingToolCallMessage );
			// add this message to the messages list, and remove the existing tool call
			return {
				...state,
				history: [
					...state.history.slice( 0, index + 1 ),
					message,
					...state.history.slice( index + 1 ),
				],
			};
		}
		console.warn(
			'could not find call message for tool result',
			message,
			existingToolCallMessage
		);
		throw new Error(
			`Could not find tool call message for tool call ID ${ message.tool_call_id }`
		);
	}

	// not a tool result, just add the message to history
	const newState = {
		...state,
		history: [ ...state.history, message ],
	};

	return newState;
};

const setThreadId = ( state, action ) => {
	localStorage.setItem( 'threadId', action.threadId );
	return {
		...state,
		threadId: action.threadId,
		history: [],
		threadRuns: [],
		threadRunsUpdated: null,
		threadMessagesUpdated: null,
		syncedThreadMessagesAt: null,
	};
};

export const reducer = ( state = initialState, action ) => {
	switch ( action.type ) {
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
		case 'TOOL_BEGIN_REQUEST':
			return {
				...state,
				isToolRunning: true,
			};
		case 'TOOL_END_REQUEST':
			return {
				...addMessageReducer( state, {
					role: 'tool',
					tool_call_id: action.id,
					content: action.result,
				} ),
				isToolRunning: false,
			};
		case 'TOOL_ERROR':
			return {
				...state,
				isToolRunning: false,
			};
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
		case 'ADD_MESSAGE':
			return addMessageReducer( state, action.message );
		case 'CLEAR_MESSAGES':
			return { ...state, history: [] };
		case 'SET_THREAD_ID':
			return setThreadId( state, action );
		case 'SET_ASSISTANT_ID':
			return {
				...state,
				assistantId: action.assistantId,
			};
		case 'CREATE_THREAD_BEGIN_REQUEST':
			return { ...state, isCreatingThread: true };
		case 'CREATE_THREAD_END_REQUEST':
			return {
				...setThreadId( state, action ),
				threadMessagesUpdated: null,
				isCreatingThread: false,
			};
		case 'CREATE_THREAD_ERROR':
			return { ...state, isCreatingThread: false, error: action.error };
		case 'DELETE_THREAD_BEGIN_REQUEST':
			return { ...state, isDeletingThread: true };
		case 'DELETE_THREAD_END_REQUEST':
			// delete from localstorage
			localStorage.removeItem( 'threadId' );
			return {
				...state,
				isDeletingThread: false,
				threadId: null,
				threadRunId: null,
				threadMessagesUpdated: null,
				threadRunsUpdated: null,
				threadRuns: [],
				syncedThreadMessagesAt: null,
				history: [],
			};
		case 'DELETE_THREAD_ERROR':
			return { ...state, isDeletingThread: false, error: action.error };
		case 'CREATE_THREAD_MESSAGE_BEGIN_REQUEST':
			return { ...state, isCreatingThreadMessage: true };
		case 'CREATE_THREAD_MESSAGE_END_REQUEST':
			// set synced to true on the message with the matching id
			return {
				...state,
				history: [
					...state.history.map( ( message ) => {
						if ( message.id === action.originalMessageId ) {
							console.warn(
								'replacing message',
								message,
								'with',
								action.message
							);
							return action.message;
						}
						return message;
					} ),
				],
				syncedThreadMessagesAt: Date.now(),
				isCreatingThreadMessage: false,
			};
		case 'CREATE_THREAD_MESSAGE_ERROR':
			return {
				...state,
				isCreatingThreadMessage: false,
				error: action.error,
			};
		case 'RUN_THREAD_BEGIN_REQUEST':
			return { ...state, isCreatingThreadRun: true };
		case 'RUN_THREAD_END_REQUEST':
			const additionalMessageIds = action.additionalMessages?.map(
				( message ) => message.id
			);

			console.warn( 'removing messages', {
				additionalMessageIds,
			} );

			return {
				...state,
				// for each message in action.additionalMessages, find them by id and set message.thread_id to action.threadRun.id
				history: state.history.map( ( message ) => {
					if ( additionalMessageIds.includes( message.id ) ) {
						return {
							...message,
							thread_id: state.threadId,
						};
					}
					return message;
				} ),
				isCreatingThreadRun: false,
				threadRunsUpdated: Date.now(),
				// threadMessagesUpdated: null, // force reloading of chat history
				threadRuns: [ action.threadRun, ...state.threadRuns ],
			};
		case 'RUN_THREAD_ERROR':
			return {
				...state,
				isCreatingThreadRun: false,
				error: action.error,
			};
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
				isFetchingThreadRun: false,
			};
		case 'GET_THREAD_RUN_ERROR':
			return {
				...state,
				isFetchingThreadRun: false,
				error: action.error,
			};
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
				threadRunsUpdated: Date.now(),
				threadRuns: action.threadRuns,
			};
		case 'GET_THREAD_RUNS_ERROR':
			return {
				...state,
				isFetchingThreadRuns: false,
				error: action.error,
			};
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
				threadMessagesUpdated: Date.now(),
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

const hasActiveRun = ( state ) => {
	/*
	 * Thread Run Statuses
	 * STATUS	DEFINITION
	 * queued	When Runs are first created or when you complete the required_action, they are moved to a queued status. They should almost immediately move to in_progress.
	 * in_progress	While in_progress, the Assistant uses the model and tools to perform steps. You can view progress being made by the Run by examining the Run Steps.
	 * completed	The Run successfully completed! You can now view all Messages the Assistant added to the Thread, and all the steps the Run took. You can also continue the conversation by adding more user Messages to the Thread and creating another Run.
	 * requires_action	When using the Function calling tool, the Run will move to a required_action state once the model determines the names and arguments of the functions to be called. You must then run those functions and submit the outputs before the run proceeds. If the outputs are not provided before the expires_at timestamp passes (roughly 10 mins past creation), the run will move to an expired status.
	 * expired	This happens when the function calling outputs were not submitted before expires_at and the run expires. Additionally, if the runs take too long to execute and go beyond the time stated in expires_at, our systems will expire the run.
	 * cancelling	You can attempt to cancel an in_progress run using the Cancel Run endpoint. Once the attempt to cancel succeeds, status of the Run moves to cancelled. Cancellation is attempted but not guaranteed.
	 * cancelled	Run was successfully cancelled.
	 * failed	You can view the reason for the failure by looking at the last_error object in the Run. The timestamp for the failure will be recorded under failed_at.
	 * incomplete	Run ended due to max_prompt_tokens or max_completion_tokens reached. You can view the specific reason by looking at the incomplete_details object in the Run.
	 */
	const currentThreadRun = state.threadRuns[ 0 ];
	return (
		currentThreadRun &&
		THREAD_RUN_RUNNING_STATUSES.includes( currentThreadRun.status )
	);
};

const getToolOutputs = ( state ) => {
	// // get list of [ tool_call_id, output ] from "tool" messages in the history
	// console.warn(
	// 	'get tool outputs',
	// 	// state.history,
	// 	state.history.filter( ( message ) => message.role === 'tool' )
	// );
	return state.history
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
	isStarted: ( state ) => state.history.length > 0,
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
	isToolRunning: ( state ) => state.isToolRunning,
	getError: ( state ) => state.error,
	getMessages: ( state ) => state.history,
	getAssistantMessage: ( state ) => {
		// return the last message only if it's an assistant message with content
		const lastMessage = state.history[ state.history.length - 1 ];
		return lastMessage?.role === 'assistant' && lastMessage.content
			? lastMessage.content
			: null;
	},
	hasActiveRun,
	getToolOutputs,
	getPendingToolCalls: ( state, function_name = null ) => {
		const messagesWithToolCalls = state.history
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
		// flatten messagesWithToolCalls
		const toolCalls = messagesWithToolCalls.reduce(
			( acc, val ) => acc.concat( val ),
			[]
		);
		const toolOutputs = getToolOutputs( state );
		return toolCalls.filter(
			( toolCall ) =>
				! toolOutputs.some(
					( toolOutput ) => toolOutput.tool_call_id === toolCall.id
				)
		);
	},
	getAdditionalMessages: ( state ) => {
		// user/assistant messages without a threadId are considered not to have been synced
		return state.history
			.filter(
				( message ) =>
					[ 'assistant', 'user' ].includes( message.role ) &&
					! message.tool_calls?.length &&
					! message.thread_id
			)
			.map( chatMessageToThreadMessage );
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

export const actions = {
	setThreadId: ( threadId ) => ( {
		type: 'SET_THREAD_ID',
		threadId,
	} ),
	setAssistantId: ( assistantId ) => ( {
		type: 'SET_ASSISTANT_ID',
		assistantId,
	} ),
	clearError: () => ( {
		type: 'CHAT_ERROR',
		error: null,
	} ),
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
	clearMessages: () => ( {
		type: 'CLEAR_MESSAGES',
		messages: [],
	} ),
	addUserMessage,
	addToolCall: ( name, args, id ) => ( {
		type: 'ADD_MESSAGE',
		message: {
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
