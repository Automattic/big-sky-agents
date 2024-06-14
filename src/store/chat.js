import uuidv4 from '../utils/uuid.js';
import ChatModel from '../agents/chat-model.js';
import AssistantModel from '../agents/assistant-model.js';

const initialState = {
	threadId: localStorage.getItem( 'threadId' ) || null, // The assistant thread ID
	threadRuns: [], // The Assistant thread runs
	assistantId: null, // The assistant ID
	history: [],
	tool_calls: [],
	running: false,
	toolRunning: false,
};

const formatToolResultContent = ( result ) => {
	if ( typeof result === 'undefined' ) {
		return '';
	}
	return typeof result === 'object'
		? JSON.stringify( result )
		: `${ result }`;
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
	async CREATE_THREAD_MESSAGE_CALL( { service, apiKey, threadId, message } ) {
		const assistantModel = AssistantModel.getInstance( service, apiKey );
		return await assistantModel.createThreadMessage( threadId, message );
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
		if ( assistantMessage.tool_calls ) {
			assistantMessage.tool_calls.forEach( ( tool_call ) => {
				tool_call.id = uuidv4();
			} );
		}
		yield actions.addMessage( assistantMessage );
		yield { type: 'CHAT_END_REQUEST' };
	} catch ( error ) {
		console.error( 'Chat error', error );
		return { type: 'CHAT_ERROR', error: error.message };
	}
}

function* runGetThreadRuns( { service, apiKey, threadId } ) {
	yield { type: 'GET_THREAD_RUNS_BEGIN_REQUEST' };
	try {
		const threadRuns = yield {
			type: 'GET_THREAD_RUNS_CALL',
			service,
			apiKey,
			threadId,
		};
		yield {
			type: 'GET_THREAD_RUNS_END_REQUEST',
			threadRuns,
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
			threadRun: runCreateThreadRunResponse,
		};
	} catch ( error ) {
		console.error( 'Chat error', error );
		return { type: 'RUN_THREAD_ERROR', error: error.message };
	}
}

/**
 * Set the result of a tool call, and if it's a promise then resolve it first
 * @param {number} tool_call_id
 * @param {*}      promise
 * @return {Object} The resulting action
 */
function* setToolCallResult( tool_call_id, promise ) {
	yield { type: 'TOOL_BEGIN_REQUEST', id: tool_call_id };
	try {
		const result = yield { type: 'RESOLVE_TOOL_CALL_RESULT', promise };
		return { type: 'TOOL_END_REQUEST', id: tool_call_id, result };
	} catch ( error ) {
		return {
			type: 'TOOL_ERROR',
			id: tool_call_id,
			error: error.message,
		};
	}
}

function filterMessage( message ) {
	if ( typeof message.content === 'undefined' || message.content === null ) {
		message.content = '';
	}
	return message;
}

// function* addMessage( message ) {
// }

function* addMessage( message, threadId, service, apiKey ) {
	yield {
		type: 'ADD_MESSAGE',
		message,
	};
	// add the message to the active thread
	if ( threadId ) {
		yield { type: 'CREATE_THREAD_MESSAGE_BEGIN_REQUEST' };
		try {
			yield {
				type: 'CREATE_THREAD_MESSAGE_CALL',
				service,
				apiKey,
				threadId,
				message,
			};
			yield {
				type: 'CREATE_THREAD_MESSAGE_END_REQUEST',
			};
		} catch ( error ) {
			console.error( 'Chat error', error );
			return {
				type: 'CREATE_THREAD_MESSAGE_ERROR',
				error: error.message,
			};
		}
	}
}

function* addUserMessage(
	content,
	image_urls = [],
	threadId,
	service,
	apiKey
) {
	const message = {
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
	};

	yield addMessage( message, threadId, service, apiKey );
}

function* addAssistantMessage(
	content,
	finish_reason,
	tool_calls,
	threadId,
	service,
	apiKey
) {
	yield addMessage(
		{
			role: 'assistant',
			content,
			finish_reason,
			tool_calls,
		},
		threadId,
		service,
		apiKey
	);
}

const addMessageReducer = ( state, message ) => {
	message = filterMessage( message );

	// special processing for tools - add the tool call messages
	if ( message.role === 'tool' && message.tool_call_id ) {
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
		const toolCallMessage = state.history.find( ( callMessage ) => {
			return (
				callMessage.role === 'assistant' &&
				callMessage.tool_calls?.some(
					( toolCall ) => toolCall.id === message.tool_call_id
				)
			);
		} );

		if ( toolCallMessage ) {
			const index = state.history.indexOf( toolCallMessage );
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
			toolCallMessage
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

	// append any tool calls
	if ( message.tool_calls ) {
		newState.tool_calls = [
			...state.tool_calls,
			...message.tool_calls.map( ( tool_call ) => ( {
				...tool_call,
				function: {
					...tool_call.function,
					arguments: JSON.parse( tool_call.function.arguments ),
				},
			} ) ),
		];
	}

	return newState;
};

export const reducer = ( state = initialState, action ) => {
	switch ( action.type ) {
		case 'CHAT_BEGIN_REQUEST':
			return { ...state, running: true };
		case 'CHAT_END_REQUEST':
			return { ...state, running: false };
		case 'CHAT_ERROR':
			return { ...state, running: false, error: action.error };
		case 'TOOL_BEGIN_REQUEST':
			return {
				...state,
				toolRunning: true,
				tool_calls: state.tool_calls.map( ( tool_call ) =>
					tool_call.id === action.id
						? { ...tool_call, inProgress: true }
						: tool_call
				),
			};
		case 'TOOL_END_REQUEST':
			return {
				...state,
				toolRunning: false,
				...addMessageReducer( state, {
					role: 'tool',
					tool_call_id: action.id,
					content: formatToolResultContent( action.result ),
				} ),
				tool_calls: [
					...state.tool_calls.filter(
						( tool_call ) => tool_call.id !== action.id
					),
				],
			};
		case 'TOOL_ERROR':
			return {
				...state,
				toolRunning: false,
				tool_calls: [
					...state.tool_calls.filter(
						( tool_call ) => tool_call.id !== action.id
					),
					state.tool_calls
						.find( ( tool_call ) => tool_call.id === action.id )
						?.map( ( tool_call ) => ( {
							...tool_call,
							error: action.error,
						} ) ),
				].filter( ( tool_call ) => typeof tool_call !== 'undefined' ),
			};
		case 'ADD_MESSAGE':
			return addMessageReducer( state, action.message );
		case 'CLEAR_MESSAGES':
			return { ...state, history: [], tool_calls: [] };
		case 'CLEAR_PENDING_TOOL_REQUESTS':
			return {
				...state,
				tool_calls: [],
			};
		case 'SET_THREAD_ID':
			localStorage.setItem( 'threadId', action.threadId );
			return {
				...state,
				threadId: action.threadId,
			};
		case 'SET_ASSISTANT_ID':
			return {
				...state,
				assistantId: action.assistantId,
			};
		case 'CREATE_THREAD_BEGIN_REQUEST':
			return { ...state, running: true };
		case 'CREATE_THREAD_END_REQUEST':
			localStorage.setItem( 'threadId', action.threadId );
			return { ...state, running: false, threadId: action.threadId };
		case 'CREATE_THREAD_ERROR':
			return { ...state, running: false, error: action.error };
		case 'CREATE_THREAD_MESSAGE_BEGIN_REQUEST':
			return { ...state, running: true };
		case 'CREATE_THREAD_MESSAGE_END_REQUEST':
			return { ...state, running: false };
		case 'CREATE_THREAD_MESSAGE_ERROR':
			return { ...state, running: false, error: action.error };
		case 'RUN_THREAD_BEGIN_REQUEST':
			return { ...state, running: true };
		case 'RUN_THREAD_END_REQUEST':
			return {
				...state,
				running: false,
				threadRuns: [ ...state.threadRuns, action.threadRun ],
			};
		case 'RUN_THREAD_ERROR':
			return { ...state, running: false, error: action.error };
		case 'GET_THREAD_RUNS_BEGIN_REQUEST':
			return { ...state, running: true };
		case 'GET_THREAD_RUNS_END_REQUEST':
			return {
				...state,
				running: false,
				threadRuns: action.threadRuns,
			};
		case 'GET_THREAD_RUNS_ERROR':
			return { ...state, running: false, error: action.error };
		default:
			return state;
	}
};

const getToolCallResult = ( state, id ) => {
	return state.tool_calls.find( ( tool_call ) => tool_call.id === id )
		?.result;
};

const getToolCalls = ( state ) => {
	return state.tool_calls;
};

export const selectors = {
	isRunning: ( state ) => state.running,
	isToolRunning: ( state ) => state.toolRunning,
	getError: ( state ) => state.error,
	getMessages: ( state ) => state.history,
	getAssistantMessage: ( state ) => {
		// return the last message only if it's an assistant message with content
		const lastMessage = state.history[ state.history.length - 1 ];
		return lastMessage?.role === 'assistant' && lastMessage.content
			? lastMessage.content
			: null;
	},
	getToolCalls,
	getToolCallResult,
	getToolCallResults: ( state ) => {
		return state.tool_calls.reduce( ( acc, tool_call ) => {
			acc[ tool_call.id ] = tool_call.result;
			return acc;
		}, {} );
	},
	getPendingToolRequests: ( state, function_name ) => {
		return state.tool_calls.filter(
			( tool_call ) =>
				( ! function_name ||
					tool_call.function.name === function_name ) &&
				( tool_call.inProgress ||
					typeof tool_call.result === 'undefined' )
		);
	},
	getThreadId: ( state ) => state.threadId,
	getAssistantId: ( state ) => state.assistantId,
	getThreadRuns: ( state ) => state.threadRun,
	getThreadRun: ( state, threadRunId ) => {
		return state.threadRuns.find(
			( threadRun ) => threadRun.id === threadRunId
		);
	},
	getThreadRunId: ( state ) => {
		return state.threadRuns[ state.threadRuns.length - 1 ]?.id
			? state.threadRuns[ state.threadRuns.length - 1 ].id
			: null;
	},
	getCurrentThreadRun: ( state ) => {
		// statuses: queued, in_progress, requires_action, cancelling, cancelled, failed, completed, incomplete, or expired
		return state.threadRuns[ state.threadRuns.length - 1 ];
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
	runChatCompletion,
	runCreateThread,
	runCreateThreadRun,
	runGetThreadRuns,
	runGetThreadRun,
	addMessage,
	clearMessages: () => ( {
		type: 'CLEAR_MESSAGES',
		messages: [],
	} ),
	clearPendingToolRequests: () => ( {
		type: 'CLEAR_PENDING_TOOL_REQUESTS',
	} ),
	// TODO: unused?
	addAssistantMessage,
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
						arguments: JSON.stringify( args ),
					},
				},
			],
		},
	} ),
};
