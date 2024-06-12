import uuidv4 from '../utils/uuid.js';
import ChatModel from '../agents/chat-model.js';

const initialState = {
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
	async CHAT_CALL( {
		messages,
		model,
		temperature,
		tools,
		systemPrompt,
		nextStepPrompt,
		service,
		apiKey,
		maxTokens,
		feature,
	} ) {
		const chatModel = ChatModel.getInstance( service, apiKey );
		return await chatModel.run( {
			model,
			messages,
			tools,
			systemPrompt,
			nextStepPrompt,
			temperature,
			maxTokens,
			feature,
		} );
	},
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
 * @param {Object}        request.systemPrompt
 * @param {Object}        request.nextStepPrompt
 * @param {string}        request.service
 * @param {string}        request.apiKey
 * @param {string}        request.feature
 */
function* runChatCompletion( {
	model,
	temperature,
	maxTokens,
	messages,
	tools,
	systemPrompt,
	nextStepPrompt,
	service,
	apiKey,
	feature,
} ) {
	yield { type: 'CHAT_BEGIN_REQUEST' };
	try {
		const assistantMessage = yield {
			type: 'CHAT_CALL',
			model,
			temperature,
			maxTokens,
			messages,
			tools,
			systemPrompt,
			nextStepPrompt,
			service,
			apiKey,
			feature,
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

const addMessage = ( state, message ) => {
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
				...addMessage( state, {
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
			return addMessage( state, action.message );
		case 'CLEAR_MESSAGES':
			return { ...state, history: [], tool_calls: [] };
		case 'CLEAR_PENDING_TOOL_REQUESTS':
			return {
				...state,
				tool_calls: [],
			};
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
};

export const actions = {
	clearError: () => ( {
		type: 'CHAT_ERROR',
		error: null,
	} ),
	setToolCallResult,
	runChatCompletion,
	addMessage: ( message ) => ( {
		type: 'ADD_MESSAGE',
		message,
	} ),
	clearMessages: () => ( {
		type: 'CLEAR_MESSAGES',
		messages: [],
	} ),
	clearPendingToolRequests: () => ( {
		type: 'CLEAR_PENDING_TOOL_REQUESTS',
	} ),
	addAssistantMessage: ( content, finish_reason, tool_calls ) => ( {
		type: 'ADD_MESSAGE',
		message: { role: 'assistant', content, finish_reason, tool_calls },
	} ),
	addUserMessage: ( content, image_urls = [] ) => ( {
		type: 'ADD_MESSAGE',
		message: {
			role: 'user',
			content: [
				{
					type: 'text',
					text: content,
				},
				...image_urls.map( ( image_url ) => ( {
					type: 'image_url',
					image_url, //: 'data:image/jpeg;base64,$base64'
				} ) ),
			],
		},
	} ),
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
