/**
 * WordPress dependencies
 */
import { useContext, useMemo } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { Context } from './context';

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
		addToolCall,
		addUserMessage,
		clearMessages,
		setToolCallResult,
		runChatCompletion,
		runCreateThread,
		runDeleteThread,
		setAssistantId,
		runCreateThreadRun,
		runGetThreadRun,
		runGetThreadRuns,
		runGetThreadMessages,
		runAddMessageToThread,
		runSubmitToolOutputs,
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
		feature,
	} = useSelect( ( select ) => {
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
			feature: store.getFeature(),
		};
	} );

	const isThreadRunComplete = useMemo( () => {
		return (
			isThreadDataLoaded &&
			! running &&
			( ! threadRun || threadRun?.status === 'completed' )
		);
	}, [ isThreadDataLoaded, running, threadRun ] );

	const isAwaitingUserInput = useMemo( () => {
		return pendingToolCalls.length > 0 || assistantMessage;
	}, [ assistantMessage, pendingToolCalls ] );

	const isThreadRunAwaitingToolOutputs = useMemo( () => {
		return (
			isThreadDataLoaded &&
			! running &&
			threadRun &&
			threadRun.status === 'requires_action' &&
			threadRun.required_action.type === 'submit_tool_outputs' &&
			requiredToolOutputs.length > 0
		);
	}, [ isThreadDataLoaded, requiredToolOutputs.length, running, threadRun ] );

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
		userSay: addUserMessage,
		assistantMessage,

		// tools
		call: addToolCall,
		setToolResult: setToolCallResult,
		pendingToolCalls,
		toolOutputs,
		requiredToolOutputs,

		// chat
		isChatAvailable,
		runChatCompletion,

		// assistants
		isAssistantAvailable,
		threadId,
		deleteThread: runDeleteThread,
		assistantId,
		threadRun,
		threadRunsUpdated,
		threadMessagesUpdated,
		setAssistantId,

		createThread: runCreateThread,
		createThreadRun: runCreateThreadRun,
		updateThreadRun: runGetThreadRun, // refresh status of running threads
		updateThreadRuns: runGetThreadRuns, // refresh status of running threads
		updateThreadMessages: runGetThreadMessages, // refresh status of running threads
		submitToolOutputs: runSubmitToolOutputs,
		addMessageToThread: runAddMessageToThread,
		isAvailable,
		isThreadRunComplete,
		isThreadRunAwaitingToolOutputs,
		isThreadRunInProgress,
		isAwaitingUserInput,
		additionalMessages,

		onReset: reset,
	};
}
