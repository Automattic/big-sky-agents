/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { Context } from './context.jsx';

/**
 * A custom react hook exposing the chat context for use.
 *
 * This exposes the `chat` value provided via the
 * <a href="#ChatProvider">Chat Provider</a> to a component implementing
 * this hook.
 *
 * It acts similarly to the `useContext` react hook.
 *
 * @example
 * ```js
 * import {
 *   ChatProvider,
 *   createChat,
 *   useChat,
 * } from '@automattic/big-sky-';
 *
 * const chat = createChat();
 *
 * const SomeChildUsingChat = ( props ) => {
 *   const chat = useChat();
 *   // ...logic implementing the chat in other react hooks.
 * };
 *
 *
 * const ParentProvidingChat = ( props ) => {
 *   return <ChatProvider value={ chat }>
 *     <SomeChildUsingChat { ...props } />
 *   </ChatProvider>
 * };
 * ```
 *
 * @return {Function}  A custom react hook exposing the chat context value.
 */

export default function useChat() {
	const agentStore = useContext( Context );

	const {
		reset,
		setEnabled,
		call,
		userSay,
		clearMessages,
		setToolResult,
		runChatCompletion,
		createThread,
		deleteThread,
		setAssistantId,
		setDefaultAssistantId,
		createThreadRun,
		updateThreadRun,
		updateThreadRuns,
		updateThreadMessages,
		addMessageToThread,
		agentSay,
		submitToolOutputs,
		setService,
		setModel,
		setTemperature,
		setApiKey,
		setFeature,
		setAssistantEnabled,
		setBaseUrl,
	} = useDispatch( agentStore );

	const {
		baseUrl,
		assistantEnabled,
		service,
		temperature,
		apiKey,
		error,
		model,
		loading,
		running,
		enabled,
		messages,
		assistantMessage,
		pendingToolCalls,
		additionalMessages,
		requiredToolOutputs,
		toolOutputs,
		threadId,
		assistantId,
		threadRun,
		threadRunsUpdated,
		threadMessagesUpdated,
		isAvailable,
		isChatAvailable,
		isAssistantAvailable,
		isThreadRunInProgress,
		isThreadDataLoaded,
		isThreadRunComplete,
		isAwaitingUserInput,
		isThreadRunAwaitingToolOutputs,
		feature,
	} = useSelect( ( select ) => ( {
		baseUrl: select( agentStore ).getBaseUrl(),
		assistantEnabled: select( agentStore ).isAssistantEnabled(),
		service: select( agentStore ).getService(),
		temperature: select( agentStore ).getTemperature(),
		apiKey: select( agentStore ).getApiKey(),
		error: select( agentStore ).getError(),
		model: select( agentStore ).getModel(),
		loading: select( agentStore ).isLoading(),
		running: select( agentStore ).isRunning(),
		enabled: select( agentStore ).isEnabled(),
		messages: select( agentStore ).getMessages(),
		assistantMessage: select( agentStore ).getAssistantMessage(),
		pendingToolCalls: select( agentStore ).getPendingToolCalls(),
		additionalMessages: select( agentStore ).getAdditionalMessages(),
		requiredToolOutputs: select( agentStore ).getRequiredToolOutputs(),
		toolOutputs: select( agentStore ).getToolOutputs(),
		threadId: select( agentStore ).getThreadId(),
		assistantId: select( agentStore ).getAssistantId(),
		threadRun: select( agentStore ).getActiveThreadRun(),
		threadRunsUpdated: select( agentStore ).getThreadRunsUpdated(),
		threadMessagesUpdated: select( agentStore ).getThreadMessagesUpdated(),
		isAvailable: select( agentStore ).isAvailable(),
		isChatAvailable: select( agentStore ).isChatAvailable(),
		isAssistantAvailable: select( agentStore ).isAssistantAvailable(),
		isThreadRunInProgress: select( agentStore ).isThreadRunInProgress(),
		isThreadDataLoaded: select( agentStore ).isThreadDataLoaded(),
		isThreadRunComplete: select( agentStore ).isThreadRunComplete(),
		isAwaitingUserInput: select( agentStore ).isAwaitingUserInput(),
		isThreadRunAwaitingToolOutputs:
			select( agentStore ).isThreadRunAwaitingToolOutputs(),
		feature: select( agentStore ).getFeature(),
	} ) );

	return {
		// running state
		enabled,
		setEnabled,
		assistantEnabled,
		setAssistantEnabled,
		loading,
		running,
		// started,
		error,

		// auth
		apiKey,
		setApiKey,

		// logging
		feature,
		setFeature,

		// llm
		model,
		setModel,
		service,
		setService,
		baseUrl,
		setBaseUrl,
		temperature,
		setTemperature,

		// messages
		messages,
		clearMessages,
		userSay,
		assistantMessage,
		agentSay,

		// tools
		call,
		setToolResult,
		pendingToolCalls,
		toolOutputs,
		requiredToolOutputs,

		// chat
		isChatAvailable,
		runChatCompletion,

		// assistants
		isAssistantAvailable,
		threadId,
		deleteThread,
		assistantId,
		threadRun,
		threadRunsUpdated,
		threadMessagesUpdated,
		setAssistantId,
		setDefaultAssistantId,

		createThread,
		createThreadRun,
		updateThreadRun, // refresh status of running threads
		updateThreadRuns, // refresh status of running threads
		updateThreadMessages, // refresh status of running threads
		submitToolOutputs,
		addMessageToThread,
		isAvailable,
		isThreadRunComplete,
		isThreadRunAwaitingToolOutputs,
		isThreadRunInProgress,
		isAwaitingUserInput,
		isThreadDataLoaded,
		additionalMessages,
		reset,
	};
}
