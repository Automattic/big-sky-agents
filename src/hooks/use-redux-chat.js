import { useDispatch, useSelect } from '@wordpress/data';
import { store as agentStore } from '../store/index.js';
import { useCallback, useEffect, useMemo } from 'react';

const useReduxChat = ( { apiKey, service, model, temperature, feature } ) => {
	const {
		clearError,
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
	} = useDispatch( agentStore );

	const {
		error,
		loading,
		enabled,
		started,
		running,
		toolRunning,
		history,
		assistantMessage,
		pendingToolCalls,
		additionalMessages,
		requiredToolOutputs,
		toolOutputs,
		threadId,
		assistantId,
		threadRun,
		hasActiveRun,
		threadRunsUpdated,
		threadMessagesUpdated,
	} = useSelect( ( select ) => {
		return {
			error: select( agentStore ).getError(),
			loading: select( agentStore ).isLoading(),
			started: select( agentStore ).isStarted(),
			running: select( agentStore ).isRunning(),
			toolRunning: select( agentStore ).isToolRunning(),
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
			hasActiveRun: select( agentStore ).hasActiveRun(),
			threadRunsUpdated: select( agentStore ).getThreadRunsUpdated(),
			threadMessagesUpdated:
				select( agentStore ).getThreadMessagesUpdated(),
		};
	} );

	const isServiceAvailable = useMemo( () => {
		return service && apiKey && enabled;
	}, [ service, apiKey, enabled ] );

	const isAssistantAvailable = useMemo( () => {
		return isServiceAvailable && assistantId && ! error;
	}, [ isServiceAvailable, assistantId, error ] );

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
			runGetThreadRuns( { service, apiKey, threadId } );
		}
	}, [
		apiKey,
		isAssistantAvailable,
		runGetThreadRuns,
		running,
		service,
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
			runGetThreadMessages( { service, apiKey, threadId } );
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
				threadId,
				threadRunId: threadRun.id,
				toolOutputs: filteredToolOutputs,
				service,
				apiKey,
			} );
		}
	}, [
		requiredToolOutputs,
		runSubmitToolOutputs,
		history,
		toolOutputs,
		threadId,
		threadRun,
		service,
		apiKey,
		running,
		hasActiveRun,
		isThreadRunComplete,
		isThreadRunAwaitingToolOutputs,
	] );

	// while threadRun.status is queued or in_progress, poll for thread run status
	useEffect( () => {
		if ( isThreadRunInProgress ) {
			const interval = setInterval( () => {
				runGetThreadRun( {
					service,
					apiKey,
					threadId,
					threadRunId: threadRun.id,
				} );
			}, 1000 );
			return () => clearInterval( interval );
		}
	}, [
		threadRun,
		service,
		apiKey,
		threadId,
		runGetThreadRun,
		isServiceAvailable,
		isThreadRunInProgress,
	] );

	// if there are pendingThreadMessages, send them using runAddMessageToThread
	useEffect( () => {
		if (
			! running &&
			isThreadRunComplete &&
			additionalMessages.length > 0
		) {
			runAddMessageToThread( {
				service,
				apiKey,
				threadId,
				message: additionalMessages[ 0 ],
			} );
		}
	}, [
		apiKey,
		threadRun,
		isThreadRunComplete,
		additionalMessages,
		runAddMessageToThread,
		service,
		threadId,
		running,
	] );

	const runChat = useCallback(
		( tools, instructions, additionalInstructions ) => {
			if (
				! service || // no ChatModel
				! apiKey || // no apiKey
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
				model,
				temperature,
				messages: history,
				tools,
				instructions,
				additionalInstructions,
				service,
				apiKey,
				feature,
			} );
		},
		[
			service,
			apiKey,
			enabled,
			running,
			error,
			history,
			pendingToolCalls.length,
			assistantMessage,
			runChatCompletion,
			model,
			temperature,
			feature,
		]
	);

	const createThreadRun = useCallback(
		( tools, instructions, additionalInstructions ) => {
			if (
				! isAssistantAvailable ||
				! isThreadRunComplete ||
				isAwaitingUserInput ||
				additionalMessages.length > 0 ||
				history.length === 0
			) {
				return;
			}

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
				// this will always be empty right now because we sync messages to the thread first, but we could use it to send additional messages
				additionalMessages,
				feature,
			} );
		},
		[
			additionalMessages,
			apiKey,
			assistantId,
			feature,
			history,
			isAssistantAvailable,
			isAwaitingUserInput,
			isThreadRunComplete,
			model,
			runCreateThreadRun,
			service,
			temperature,
			threadId,
		]
	);

	const createThread = useCallback( () => {
		runCreateThread( { service, apiKey } );
	}, [ runCreateThread, service, apiKey ] );

	const deleteThread = useCallback( () => {
		if ( service && apiKey && threadId ) {
			runDeleteThread( { service, apiKey, threadId } );
		}
	}, [ runDeleteThread, service, apiKey, threadId ] );

	const updateThreadRun = useCallback( () => {
		if ( isAssistantAvailable && threadId && threadRun?.id ) {
			runGetThreadRun( {
				service,
				apiKey,
				threadId,
				threadRunId: threadRun.id,
			} );
		}
	}, [
		isAssistantAvailable,
		threadId,
		threadRun.id,
		runGetThreadRun,
		service,
		apiKey,
	] );

	const updateThreadRuns = useCallback( () => {
		if ( isAssistantAvailable && threadId ) {
			runGetThreadRuns( {
				service,
				apiKey,
				threadId,
			} );
		}
	}, [ isAssistantAvailable, threadId, runGetThreadRuns, service, apiKey ] );

	const updateThreadMessages = useCallback( () => {
		if ( service && apiKey && threadId ) {
			runGetThreadMessages( { service, apiKey, threadId } );
		}
	}, [ threadId, runGetThreadMessages, service, apiKey ] );

	const userSay = useCallback(
		( message, image_urls = [] ) => {
			addUserMessage( message, image_urls );
		},
		[ addUserMessage ]
	);

	const onReset = useCallback( () => {
		clearMessages();
		clearError();
		deleteThread();
	}, [ clearError, clearMessages, deleteThread ] );

	return {
		// running state
		enabled,
		setEnabled,
		loading,
		running,
		toolRunning,
		started,
		error,

		// messages
		history,
		clearMessages,
		userSay,
		assistantMessage,

		// tools
		call: addToolCall,
		setToolResult: setToolCallResult,
		pendingToolCalls,
		toolOutputs,
		runChat, // run a chat completion with messages, tools, instructions and additionalInstructions

		// assistants
		threadId,
		createThread,
		deleteThread,
		assistantId,
		setAssistantId,

		createThreadRun, // run a thread
		updateThreadRun,
		updateThreadRuns, // refresh status of running threads
		threadRun,
		updateThreadMessages,

		onReset,
	};
};

export default useReduxChat;
