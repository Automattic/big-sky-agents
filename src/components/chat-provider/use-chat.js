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
		addAssistantMessage,
		submitToolOutputs,
		setService,
		setModel,
		setTemperature,
		setApiKey,
		setFeature,
		setAssistantEnabled,
	} = useDispatch( agentStore );

	const assistantEnabled = useSelect( ( select ) =>
		select( agentStore ).isAssistantEnabled()
	);
	const service = useSelect( ( select ) =>
		select( agentStore ).getService()
	);
	const temperature = useSelect( ( select ) =>
		select( agentStore ).getTemperature()
	);
	const apiKey = useSelect( ( select ) => select( agentStore ).getApiKey() );
	const error = useSelect( ( select ) => select( agentStore ).getError() );
	const model = useSelect( ( select ) => select( agentStore ).getModel() );
	const loading = useSelect( ( select ) => select( agentStore ).isLoading() );
	const running = useSelect( ( select ) => select( agentStore ).isRunning() );
	const enabled = useSelect( ( select ) => select( agentStore ).isEnabled() );
	const messages = useSelect( ( select ) =>
		select( agentStore ).getMessages()
	);
	const assistantMessage = useSelect( ( select ) =>
		select( agentStore ).getAssistantMessage()
	);
	const pendingToolCalls = useSelect( ( select ) =>
		select( agentStore ).getPendingToolCalls()
	);
	const additionalMessages = useSelect( ( select ) =>
		select( agentStore ).getAdditionalMessages()
	);
	const requiredToolOutputs = useSelect( ( select ) =>
		select( agentStore ).getRequiredToolOutputs()
	);
	const toolOutputs = useSelect( ( select ) =>
		select( agentStore ).getToolOutputs()
	);
	const threadId = useSelect( ( select ) =>
		select( agentStore ).getThreadId()
	);
	const assistantId = useSelect( ( select ) =>
		select( agentStore ).getAssistantId()
	);
	const threadRun = useSelect( ( select ) =>
		select( agentStore ).getActiveThreadRun()
	);
	const threadRunsUpdated = useSelect( ( select ) =>
		select( agentStore ).getThreadRunsUpdated()
	);
	const threadMessagesUpdated = useSelect( ( select ) =>
		select( agentStore ).getThreadMessagesUpdated()
	);
	const isAvailable = useSelect( ( select ) =>
		select( agentStore ).isAvailable()
	);
	const isChatAvailable = useSelect( ( select ) =>
		select( agentStore ).isChatAvailable()
	);
	const isAssistantAvailable = useSelect( ( select ) =>
		select( agentStore ).isAssistantAvailable()
	);
	const isThreadRunInProgress = useSelect( ( select ) =>
		select( agentStore ).isThreadRunInProgress()
	);
	const isThreadDataLoaded = useSelect( ( select ) =>
		select( agentStore ).isThreadDataLoaded()
	);
	const isThreadRunComplete = useSelect( ( select ) =>
		select( agentStore ).isThreadRunComplete()
	);
	const isAwaitingUserInput = useSelect( ( select ) =>
		select( agentStore ).isAwaitingUserInput()
	);
	const isThreadRunAwaitingToolOutputs = useSelect( ( select ) =>
		select( agentStore ).isThreadRunAwaitingToolOutputs()
	);
	const feature = useSelect( ( select ) =>
		select( agentStore ).getFeature()
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
		addAssistantMessage,

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
