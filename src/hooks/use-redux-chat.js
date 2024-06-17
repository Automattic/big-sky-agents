import { useDispatch, useSelect } from '@wordpress/data';
import { store as agentStore } from '../store/index.js';
import { useCallback, useEffect } from 'react';

const useReduxChat = ( { apiKey, service, model, temperature, feature } ) => {
	const {
		setStarted,
		clearError,
		setEnabled,
		addToolCall,
		addUserMessage,
		clearMessages,
		clearPendingToolRequests,
		setToolCallResult: runSetToolCallResult,
		runChatCompletion,
		runCreateThread,
		// runCreateAssistant,
		setAssistantId,
		runCreateThreadRun,
		runGetThreadRuns,
		runGetThreadMessages,
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
		threadRunsUpdated,
		threadMessagesUpdated,
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
			threadRun: select( agentStore ).getActiveThreadRun(),
			threadRunsUpdated: select( agentStore ).getThreadRunsUpdated(),
			threadMessagesUpdated:
				select( agentStore ).getThreadMessagesUpdated(),
		};
		return values;
	} );

	// update thread runs and messages if they haven't been updated
	useEffect( () => {
		if ( threadId && ! running ) {
			if ( threadRunsUpdated === null ) {
				runGetThreadRuns( { service, apiKey, threadId } );
			}

			if ( threadMessagesUpdated === null ) {
				runGetThreadMessages( { service, apiKey, threadId } );
			}
		}
	}, [
		threadRunsUpdated,
		running,
		runGetThreadRuns,
		service,
		apiKey,
		threadId,
		threadMessagesUpdated,
		runGetThreadMessages,
	] );

	// if we have a thread, and threadRunId is false, and running is false, create a thread run
	// useEffect( () => {
	// 	if ( threadId && ! threadRun && ! running ) {
	// 		runCreateThreadRun();
	// 	}
	// }, [ threadId, threadRun, running, runCreateThreadRun ] );

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
				! enabled // disabled
			) {
				console.warn( 'not running assistant', {
					service,
					apiKey,
					assistantId,
					running,
					error,
					enabled,
				} );
				return;
			}
			// if we have an active run, refuse
			if ( threadRun ) {
				console.warn( 'active run exists', { threadRun } );
				return;
			}
			// first, create a thread (TODO: update existing thread!)
			// if ( ! threadId ) {
			// 	runCreateThread( { service, apiKey: token } );
			// } else {
			// 	console.warn( 'thread already exists', { threadId } );
			// }
			console.warn( 'creating thread run', {
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
			threadId,
			model,
			temperature,
			feature,
			runCreateThreadRun,
			threadRun,
		]
	);

	const createThread = useCallback( () => {
		runCreateThread( { service, apiKey } );
	}, [ runCreateThread, service, apiKey ] );

	const updateThreadRuns = useCallback( () => {
		runGetThreadRuns( {
			service,
			apiKey,
			threadId,
		} );
	}, [ runGetThreadRuns, service, apiKey, threadId ] );

	const updateThreadMessages = useCallback( () => {
		if ( threadId ) {
			runGetThreadMessages( { service, apiKey, threadId } );
		}
	}, [ runGetThreadMessages, service, apiKey, threadId ] );

	const userSay = useCallback(
		( message, image_urls = [] ) => {
			addUserMessage( message, image_urls, threadId, service, apiKey );
			// run a new thread
			if ( assistantId && threadId ) {
				runCreateThreadRun( {
					service,
					apiKey,
					assistantId,
					threadId,
					model,
					temperature,
					feature,
				} );
			}
		},
		[
			addUserMessage,
			threadId,
			service,
			apiKey,
			runCreateThreadRun,
			assistantId,
			model,
			temperature,
			feature,
		]
	);

	const onReset = useCallback( () => {
		clearPendingToolRequests();
		clearMessages();
		clearError();
	}, [ clearError, clearMessages, clearPendingToolRequests ] );

	const setToolCallResult = useCallback(
		( toolCallId, result ) => {
			runSetToolCallResult(
				toolCallId,
				result,
				threadId,
				threadRun?.id,
				service,
				apiKey
			);
		},
		[ apiKey, runSetToolCallResult, service, threadId, threadRun?.id ]
	);

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

		createThreadRun, // run a thread
		updateThreadRuns, // refresh status of running threads
		threadRun,
		updateThreadMessages,

		onReset,
	};
};

export default useReduxChat;
