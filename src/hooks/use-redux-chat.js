import { useDispatch, useSelect } from '@wordpress/data';
import { store as agentStore } from '../store/index.js';
import { useCallback } from 'react';

const useReduxChat = ( { apiKey, service, model, temperature, feature } ) => {
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
		// runCreateAssistant,
		setAssistantId,
		runCreateThreadRun,
		runGetThreadRun,
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
		threadRun,
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
			threadRun: select( agentStore ).getCurrentThreadRun(),
		};
		return values;
	} );

	const runAgent = useCallback(
		( messages, tools, instructions, additionalInstructions ) => {
			if (
				! service || // no ChatModel
				! apiKey || // no apiKey
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
				apiKey,
				feature,
			} );
		},
		[
			model,
			temperature,
			service,
			apiKey,
			enabled,
			running,
			error,
			pendingToolRequests,
			assistantMessage,
			runChatCompletion,
			feature,
		]
	);

	const createThreadRun = useCallback(
		( tools, instructions, additionalInstructions ) => {
			if (
				! service || // no ChatModel
				! apiKey || // no apiKey
				! assistantId || // disabled
				running || // already running
				error || // there's an error
				! enabled || // disabled
				pendingToolRequests.length > 0 || // waiting on tool calls
				assistantMessage // the assistant has a question for the user
			) {
				console.warn( 'not running assistant', {
					service,
					apiKey,
					assistantId,
					running,
					error,
					enabled,
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

			runCreateThreadRun( {
				service,
				apiKey,
				assistantId,
				threadId,
				model,
				temperature,
				tools,
				instructions,
				additionalInstructions,
				feature,
			} );
		},
		[
			service,
			apiKey,
			assistantId,
			running,
			error,
			enabled,
			pendingToolRequests,
			assistantMessage,
			runCreateThreadRun,
			threadId,
			model,
			temperature,
			feature,
		]
	);

	const createThread = useCallback( () => {
		runCreateThread( { service, apiKey } );
	}, [ runCreateThread, service, apiKey ] );

	const updateThreadRun = useCallback( () => {
		// status is queued, in_progress, requires_action, cancelling, cancelled, failed, completed, incomplete, or expired
		if (
			threadRun &&
			! [ 'cancelled', 'failed', 'completed' ].includes(
				threadRun.status
			)
		) {
			runGetThreadRun( {
				service,
				apiKey,
				threadId,
				threadRunId: threadRun.id,
			} );
		} else {
			console.warn( 'threadRun is not in a state to update', {
				threadRun,
			} );
		}
	}, [ threadRun, runGetThreadRun, service, apiKey, threadId ] );

	const userSay = useCallback(
		( message, image_urls = [] ) => {
			addUserMessage( message, image_urls, threadId, service, apiKey );
		},
		[ addUserMessage, service, threadId, apiKey ]
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
		userSay,
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
		setAssistantId,

		createThreadRun, // run an assistant completion with messages and tools
		updateThreadRun, // refresh the assistant completion
		threadRun,

		onReset,
	};
};

export default useReduxChat;
