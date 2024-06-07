import { useDispatch, useSelect } from '@wordpress/data';
import { store as agentStore } from '../../store/index.js';
import { useCallback } from 'react';

const useReduxChat = ( { chatModel, model, temperature } ) => {
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
		};
		return values;
	} );

	const runAgent = useCallback(
		( messages, tools, systemPrompt, nextStepPrompt ) => {
			if (
				! chatModel || // no ChatModel
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
				history: messages,
				tools,
				systemPrompt,
				nextStepPrompt,
				service: chatModel.getService(),
				apiKey: chatModel.getApiKey(),
			} );
		},
		[
			chatModel,
			enabled,
			running,
			error,
			pendingToolRequests,
			assistantMessage,
			runChatCompletion,
			model,
			temperature,
		]
	);

	const onReset = useCallback( () => {
		clearPendingToolRequests();
		clearMessages();
		clearError();
	}, [] );

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

		runAgent, // run a chat completion with tool, systemPrompt and nextStepPrompt

		onReset,
	};
};

export default useReduxChat;
