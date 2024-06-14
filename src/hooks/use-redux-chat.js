import { useDispatch, useSelect } from '@wordpress/data';
import { store as agentStore } from '../store/index.js';
import { useCallback } from 'react';

const useReduxChat = ( { token, service, model, temperature, feature } ) => {
	const {
		setStarted,
		clearError,
		setEnabled,
		addToolCall,
		addUserMessage,
		clearMessages,
		clearPendingToolRequests,
		setToolCallResult,
		runChatCompletion,
		runCreateThread,
		runCreateAssistant,
		setAssistantId,
		runAssistantThread,
	} = useDispatch( agentStore );

	const {
		error,
		started,
		enabled,
		running,
		toolRunning,
		history,
		assistantMessage,
		pendingToolRequests,
		threadId,
		assistantId,
		assistantRunId,
	} = useSelect( ( select ) => {
		const values = {
			error: select( agentStore ).getError(),
			started: select( agentStore ).isStarted(),
			running: select( agentStore ).isRunning(),
			toolRunning: select( agentStore ).isToolRunning(),
			enabled: select( agentStore ).isEnabled(),
			history: select( agentStore ).getMessages(),
			assistantMessage: select( agentStore ).getAssistantMessage(),
			pendingToolRequests: select( agentStore ).getPendingToolRequests(),
			threadId: select( agentStore ).getThreadId(),
			assistantId: select( agentStore ).getAssistantId(),
			assistantRunId: select( agentStore ).getAssistantRunId(),
		};
		return values;
	} );

	const runAgent = useCallback(
		( messages, tools, instructions, additionalInstructions ) => {
			if (
				! service || // no ChatModel
				! token || // no apiKey
				! enabled || // disabled
				running || // already running
				error || // there's an error
				! messages.length > 0 || // nothing to process
				pendingToolRequests.length > 0 || // waiting on tool calls
				assistantMessage // the assistant has a question for the user
			) {
				// console.warn( 'not running agent', {
				// 	chatModel,
				// 	error,
				// 	enabled,
				// 	running,
				// 	messages,
				// 	pendingToolRequests,
				// 	assistantMessage,
				// } );
				return;
			}
			runChatCompletion( {
				model,
				temperature,
				messages,
				tools,
				instructions,
				additionalInstructions,
				service,
				apiKey: token,
				feature,
			} );
		},
		[
			model,
			temperature,
			service,
			token,
			enabled,
			running,
			error,
			pendingToolRequests,
			assistantMessage,
			runChatCompletion,
			feature,
		]
	);

	const runAssistant = useCallback(
		( messages, tools, instructions, additionalInstructions ) => {
			if (
				! service || // no ChatModel
				! token || // no apiKey
				! assistantId || // disabled
				running || // already running
				error || // there's an error
				! enabled || // disabled
				! messages.length > 0 || // nothing to process
				pendingToolRequests.length > 0 || // waiting on tool calls
				assistantMessage // the assistant has a question for the user
			) {
				console.warn( 'not running agent', {
					service,
					token,
					assistantId,
					running,
					error,
					enabled,
					messages,
					pendingToolRequests,
					assistantMessage,
				} );
				return;
			}
			// first, create a thread (TODO: update existing thread!)
			// if ( ! threadId ) {
			// 	runCreateThread( { service, apiKey: token } );
			// } else {
			// 	console.warn( 'thread already exists', { threadId } );
			// }

			runAssistantThread( {
				service,
				apiKey: token,
				assistantId,
				threadId,
				model,
				temperature,
				messages,
				tools,
				instructions,
				additionalInstructions,
				feature,
			} );
		},
		[
			assistantId,
			assistantMessage,
			enabled,
			error,
			feature,
			model,
			pendingToolRequests,
			runAssistantThread,
			running,
			service,
			temperature,
			threadId,
			token,
		]
	);

	const createThread = useCallback( () => {
		runCreateThread( { service, apiKey: token } );
	}, [ runCreateThread, service, token ] );

	const createAssistant = useCallback(
		( request ) => {
			runCreateAssistant( {
				service,
				model,
				temperature,
				apiKey: token,
				...request,
			} );
		},
		[ model, runCreateAssistant, service, temperature, token ]
	);

	const onReset = useCallback( () => {
		clearPendingToolRequests();
		clearMessages();
		clearError();
	}, [ clearError, clearMessages, clearPendingToolRequests ] );

	return {
		// running state
		running,
		toolRunning,
		enabled,
		setEnabled,
		started,
		setStarted,
		error,

		// messages
		history,
		clearMessages,
		userSay: addUserMessage,
		agentMessage: assistantMessage,

		// tools
		call: addToolCall,
		setToolCallResult,
		pendingToolRequests,
		clearPendingToolRequests,

		runAgent, // run a chat completion with messages, tools, instructions and additionalInstructions

		// assistants
		threadId,
		createThread,
		assistantId,
		createAssistant,
		setAssistantId,

		assistantRunId,
		runAssistant, // run an assistant completion with messages and tools

		onReset,
	};
};

export default useReduxChat;
