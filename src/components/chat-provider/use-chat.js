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
		submitToolOutputs,
		setService,
		setModel,
		setTemperature,
		setApiKey,
		setFeature,
		setAssistantEnabled,
	} = useDispatch( agentStore );

	const {
		assistantEnabled,
		apiKey,
		service,
		model,
		temperature,
		error,
		loading,
		enabled,
		running,
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
	} = useSelect(
		( select ) => {
			const store = select( agentStore );
			return {
				assistantEnabled: store.isAssistantEnabled(),
				service: store.getService(),
				apiKey: store.getApiKey(),
				error: store.getError(),
				model: store.getModel(),
				loading: store.isLoading(),
				running: store.isRunning(),
				enabled: store.isEnabled(),
				messages: store.getMessages(),
				assistantMessage: store.getAssistantMessage(),
				pendingToolCalls: store.getPendingToolCalls(),
				additionalMessages: store.getAdditionalMessages(),
				requiredToolOutputs: store.getRequiredToolOutputs(),
				toolOutputs: store.getToolOutputs(),
				threadId: store.getThreadId(),
				assistantId: store.getAssistantId(),
				threadRun: store.getActiveThreadRun(),
				threadRunsUpdated: store.getThreadRunsUpdated(),
				threadMessagesUpdated: store.getThreadMessagesUpdated(),
				isAvailable: store.isAvailable(),
				isChatAvailable: store.isChatAvailable(),
				isAssistantAvailable: store.isAssistantAvailable(),
				isThreadRunInProgress: store.isThreadRunInProgress(),
				isThreadDataLoaded: store.isThreadDataLoaded(),
				isThreadRunComplete: store.isThreadRunComplete(),
				isAwaitingUserInput: store.isAwaitingUserInput(),
				isThreadRunAwaitingToolOutputs:
					store.isThreadRunAwaitingToolOutputs(),
				feature: store.getFeature(),
			};
		},
		[ agentStore ]
	);

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
		temperature,
		setTemperature,

		// messages
		messages,
		clearMessages,
		userSay,
		assistantMessage,

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
