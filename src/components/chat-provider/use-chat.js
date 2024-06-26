/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useMemo } from 'react';

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
 * @param {Object} options         The chat options.
 * @param {string} options.apiKey  The API key for the chat service.
 * @param {string} options.feature The feature to use for the chat.
 * @example
 * ```js
 * import {
 *   ChatProvider,
 *   createChat,
 *   useChat,
 * } from '@automattic/big-sky-agents';
 *
 * const chat = createChat( {
 *   apiKey,
 *   feature,
 * } );
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

export default function useChat( { apiKey, feature } ) {
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
		setApiKey,
		setService,
		setModel,
		setTemperature,
	} = useDispatch( agentStore );

	const {
		apiKey: contextApiKey,
		service,
		model,
		temperature,
		error,
		loading,
		enabled,
		started,
		running,
		history,
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
		isAssistantAvailable,
	} = useSelect( ( select ) => {
		return {
			error: select( agentStore ).getError(),
			loading: select( agentStore ).isLoading(),
			started: select( agentStore ).isStarted(),
			running: select( agentStore ).isRunning(),
			enabled: select( agentStore ).isEnabled(),
			history: select( agentStore ).getMessages(),
			assistantMessage: select( agentStore ).getAssistantMessage(),
			pendingToolCalls: select( agentStore ).getPendingToolCalls(),
			additionalMessages: select( agentStore ).getAdditionalMessages(),
			requiredToolOutputs: select( agentStore ).getRequiredToolOutputs(),
			toolOutputs: select( agentStore ).getToolOutputs(),
			threadId: select( agentStore ).getThreadId(),
			assistantId: select( agentStore ).getAssistantId(),
			threadRun: select( agentStore ).getActiveThreadRun(),
			threadRunsUpdated: select( agentStore ).getThreadRunsUpdated(),
			threadMessagesUpdated:
				select( agentStore ).getThreadMessagesUpdated(),
			isAssistantAvailable: select( agentStore ).isAssistantAvailable(),
		};
	} );

	// if apiKey is different from contextApiKey, or service is different from contextService, set them
	useEffect( () => {
		if ( apiKey !== contextApiKey ) {
			setApiKey( apiKey );
		}
	}, [ apiKey, contextApiKey, setApiKey ] );

	const isThreadDataLoaded = useMemo( () => {
		return (
			isAssistantAvailable && threadRunsUpdated && threadMessagesUpdated
		);
	}, [ isAssistantAvailable, threadMessagesUpdated, threadRunsUpdated ] );

	const isThreadRunComplete = useMemo( () => {
		return (
			isThreadDataLoaded &&
			! running &&
			( ! threadRun || threadRun?.status === 'completed' )
		);
	}, [ isThreadDataLoaded, running, threadRun ] );

	const isThreadRunInProgress = useMemo( () => {
		return (
			isAssistantAvailable &&
			threadId &&
			! running &&
			[ 'queued', 'in_progress' ].includes( threadRun?.status )
		);
	}, [ isAssistantAvailable, threadId, running, threadRun ] );

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

	// update thread runs if they haven't been updated
	useEffect( () => {
		if (
			isAssistantAvailable &&
			! running &&
			threadId &&
			threadRunsUpdated === null
		) {
			runGetThreadRuns();
		}
	}, [
		isAssistantAvailable,
		runGetThreadRuns,
		running,
		threadId,
		threadRunsUpdated,
	] );

	// update messages if they haven't been updated
	useEffect( () => {
		if (
			isAssistantAvailable &&
			! running &&
			threadId &&
			( ! threadMessagesUpdated ||
				threadMessagesUpdated / 1000 < threadRun?.created_at )
		) {
			runGetThreadMessages();
		}
	}, [
		apiKey,
		isAssistantAvailable,
		runGetThreadMessages,
		running,
		service,
		threadId,
		threadMessagesUpdated,
		threadRun?.created_at,
	] );

	// if there are required tool outputs, run the agent
	// toolOutputs looks like this:
	// [
	// 	{
	// 		tool_call_id: toolCallId,
	// 		output,
	// 	},
	// ]
	useEffect( () => {
		console.warn(
			'might submit tool outputs',
			isThreadRunAwaitingToolOutputs,
			toolOutputs,
			requiredToolOutputs
		);
		if ( isThreadRunAwaitingToolOutputs && toolOutputs.length > 0 ) {
			// requiredToolOutputs is a list of toolcalls with an ID
			// toolOutputs is a list of { tool_call_id: $id, output: $json_blob }
			// we need to submit toolOutputs with matching ids

			const filteredToolOutputs = toolOutputs.filter( ( toolOutput ) => {
				return requiredToolOutputs.some(
					( requiredToolOutput ) =>
						requiredToolOutput.id === toolOutput.tool_call_id
				);
			} );

			// if there are any missing, throw an error
			if ( filteredToolOutputs.length !== requiredToolOutputs.length ) {
				const missingOutputs = requiredToolOutputs.filter(
					( requiredToolOutput ) =>
						! toolOutputs.some(
							( toolOutput ) =>
								requiredToolOutput.id ===
								toolOutput.tool_call_id
						)
				);
				console.warn( 'missing outputs', missingOutputs );
			}

			if ( filteredToolOutputs.length === 0 ) {
				return;
			}

			runSubmitToolOutputs( {
				threadRunId: threadRun.id,
				toolOutputs: filteredToolOutputs,
			} );
		}
	}, [
		isThreadRunAwaitingToolOutputs,
		requiredToolOutputs,
		runSubmitToolOutputs,
		threadRun?.id,
		toolOutputs,
	] );

	// while threadRun.status is queued or in_progress, poll for thread run status
	useEffect( () => {
		if ( isThreadRunInProgress ) {
			const interval = setInterval( () => {
				runGetThreadRun();
			}, 1000 );
			return () => clearInterval( interval );
		}
	}, [ runGetThreadRun, isThreadRunInProgress ] );

	// if there are pendingThreadMessages, send them using runAddMessageToThread
	useEffect( () => {
		if ( isThreadRunComplete && additionalMessages.length > 0 ) {
			runAddMessageToThread( {
				message: additionalMessages[ 0 ],
			} );
		}
	}, [ additionalMessages, isThreadRunComplete, runAddMessageToThread ] );

	const runChat = useCallback(
		( tools, instructions, additionalInstructions ) => {
			if (
				! enabled || // disabled
				running || // already running
				error || // there's an error
				! history.length > 0 || // nothing to process
				pendingToolCalls.length > 0 || // waiting on tool calls
				assistantMessage // the assistant has a question for the user
			) {
				return;
			}
			runChatCompletion( {
				tools,
				instructions,
				additionalInstructions,
				feature,
			} );
		},
		[
			enabled,
			running,
			error,
			history,
			pendingToolCalls.length,
			assistantMessage,
			runChatCompletion,
			feature,
		]
	);

	const createThreadRun = useCallback(
		( tools, instructions, additionalInstructions ) => {
			if (
				! isThreadRunComplete ||
				isAwaitingUserInput ||
				additionalMessages.length > 0 ||
				history.length === 0
			) {
				console.warn( 'not running thread run', {
					isThreadRunComplete,
					isAwaitingUserInput,
					additionalMessages,
					history,
				} );
				return;
			}

			runCreateThreadRun( {
				tools,
				instructions,
				additionalInstructions,
				// this will always be empty right now because we sync messages to the thread first, but we could use it to send additional messages
				additionalMessages,
				feature,
			} );
		},
		[
			additionalMessages,
			feature,
			history,
			isAwaitingUserInput,
			isThreadRunComplete,
			runCreateThreadRun,
		]
	);

	const onReset = useCallback( () => {
		reset( { service, apiKey, threadId } );
	}, [ apiKey, reset, service, threadId ] );

	return {
		// running state
		enabled,
		setEnabled,
		loading,
		running,
		started,
		error,

		// llm
		model,
		setModel,
		service,
		setService,
		temperature,
		setTemperature,

		// messages
		history,
		clearMessages,
		userSay: addUserMessage,
		assistantMessage,

		// tools
		call: addToolCall,
		setToolResult: setToolCallResult,
		pendingToolCalls,
		toolOutputs,
		runChat, // run a chat completion with messages, tools, instructions and additionalInstructions

		// assistants
		threadId,
		createThread: runCreateThread,
		deleteThread: runDeleteThread,
		assistantId,
		setAssistantId,

		createThreadRun, // run a thread
		updateThreadRun: runGetThreadRun, // refresh status of running threads
		updateThreadRuns: runGetThreadRuns, // refresh status of running threads
		threadRun,
		updateThreadMessages: runGetThreadMessages,

		onReset,
	};
}
