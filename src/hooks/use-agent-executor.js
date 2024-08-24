/**
 * WordPress dependencies
 */
import { useEffect, useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useAgents from '../components/agents-provider/use-agents.js';
import useChat from '../components/chat-provider/use-chat.js';
import useToolkits from '../components/toolkits-provider/use-toolkits.js';
import { toOpenAITool } from '../ai/utils/openai.js';

const useAgentExecutor = () => {
	const { activeAgent, started, setAgentStarted } = useAgents();

	const {
		messages,
		isAssistantAvailable,
		isChatAvailable,
		loading,
		running,
		isAvailable,
		isAwaitingUserInput,
		isThreadRunAwaitingToolOutputs,
		isThreadRunInProgress,
		isThreadRunComplete,
		isThreadDataLoaded,
		graphId,
		threadId,
		enabled,
		assistantEnabled,
		assistantMessage,
		error,
		runChatCompletion,
		createThread,
		createThreadRun,
		threadRun,
		updateThreadRun,
		updateThreadRuns,
		updateThreadMessages,
		addMessageToThread,
		threadRunsUpdated,
		threadMessagesUpdated,
		toolOutputs,
		requiredToolOutputs,
		submitToolOutputs,
		pendingToolCalls,
		setToolResult,
		additionalMessages,
		assistantId,
		setGraphId,
		setAssistantId,
		agentSay,
		autoCreateAssistant,
		createAssistant,
	} = useChat();

	const { tools, invoke, hasToolkits, context, callbacks } = useToolkits();

	const [ instructions, setInstructions ] = useState( '' );
	const [ additionalInstructions, setAdditionalInstructions ] =
		useState( '' );
	const [ prevToolOutputsLength, setPrevToolOutputsLength ] = useState( 0 );

	// update thread runs if they haven't been updated
	useEffect( () => {
		if (
			isAssistantAvailable &&
			! running &&
			threadId &&
			threadRunsUpdated === null
		) {
			updateThreadRuns();
		}
	}, [
		isAssistantAvailable,
		running,
		threadId,
		threadRunsUpdated,
		updateThreadRuns,
	] );

	// create assistant if it doesn't exist
	useEffect( () => {
		if (
			enabled &&
			! running &&
			autoCreateAssistant &&
			! assistantId &&
			graphId
		) {
			// TODO: decouple this from langgraph cloud's peculiarities
			createAssistant( { graphId } );
		}
	}, [
		enabled,
		running,
		autoCreateAssistant,
		assistantId,
		createAssistant,
		graphId,
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
			updateThreadMessages();
		}
	}, [
		isAssistantAvailable,
		running,
		threadId,
		threadMessagesUpdated,
		threadRun?.created_at,
		updateThreadMessages,
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

			if ( filteredToolOutputs.length === 0 ) {
				return;
			}

			submitToolOutputs( {
				toolOutputs: filteredToolOutputs,
			} );
		}
	}, [
		isThreadRunAwaitingToolOutputs,
		requiredToolOutputs,
		submitToolOutputs,
		toolOutputs,
	] );

	// execute tools using callbacks
	useEffect( () => {
		// process tool calls for any tools with callbacks
		// note that tools without callbacks will be processed outside this loop,
		// and will need responses before the ChatModel can run again
		if (
			! running &&
			! error &&
			isAvailable &&
			pendingToolCalls.length > 0
		) {
			pendingToolCalls.forEach( ( tool_call ) => {
				const args =
					typeof tool_call.function.arguments === 'string'
						? JSON.parse( tool_call.function.arguments )
						: tool_call.function.arguments;

				// see: https://community.openai.com/t/model-tries-to-call-unknown-function-multi-tool-use-parallel/490653/7
				if ( tool_call.function.name === 'multi_tool_use.parallel' ) {
					/**
					 * Looks like this:
					 * multi_tool_use.parallel({"tool_uses":[{"recipient_name":"WPSiteSpec","parameters":{"title":"Lorem Ipsum","description":"Lorem ipsum dolor sit amet, consectetur adipiscing elit.","type":"Blog","topic":"Lorem Ipsum","location":"Lorem Ipsum"}}]})
					 *
					 * I assume the result is supposed to be an array... but I could be wrong.
					 */
					const promises = args.tool_uses.map( ( tool_use ) => {
						const callback = callbacks[ tool_use.recipient_name ];

						if ( typeof callback === 'function' ) {
							console.warn(
								'🧠 Parallel tool callback',
								tool_use.recipient_name
							);
							return callback( tool_use.parameters );
						}
						return `Unknown tool ${ tool_use.recipient_name }`;
					} );

					const toolResult = Promise.all( promises );

					setToolResult( tool_call.id, toolResult );
				}

				const callback = callbacks[ tool_call.function.name ];

				if ( typeof callback === 'function' ) {
					console.warn( '🧠 Tool callback', tool_call.function.name );
					setToolResult( tool_call.id, callback( args ) );
				}
			} );
		}
	}, [
		callbacks,
		error,
		isAvailable,
		pendingToolCalls,
		running,
		setToolResult,
	] );

	// while threadRun.status is queued or in_progress, poll for thread run status
	useEffect( () => {
		if ( isAssistantAvailable && ! running && isThreadRunInProgress ) {
			const interval = setInterval( () => {
				updateThreadRun();
			}, 1000 );
			return () => clearInterval( interval );
		}
	}, [
		isAssistantAvailable,
		updateThreadRun,
		isThreadRunInProgress,
		running,
	] );

	// if there are pendingThreadMessages, send them using addMessageToThread
	// useEffect( () => {
	// 	if (
	// 		isAssistantAvailable &&
	// 		! running &&
	// 		isThreadRunComplete &&
	// 		additionalMessages.length > 0
	// 	) {
	// 		addMessageToThread( {
	// 			message: additionalMessages[ 0 ],
	// 		} );
	// 	}
	// }, [
	// 	running,
	// 	additionalMessages,
	// 	isThreadRunComplete,
	// 	addMessageToThread,
	// 	isAssistantAvailable,
	// ] );

	const toolkitsLoaded = useMemo( () => {
		return ! activeAgent?.toolkits || hasToolkits( activeAgent?.toolkits );
	}, [ hasToolkits, activeAgent ] );

	useEffect( () => {
		if ( activeAgent && toolkitsLoaded ) {
			const newInstructions =
				typeof activeAgent.instructions === 'function'
					? activeAgent.instructions( context )
					: activeAgent.instructions;

			const newAdditionalInstructions =
				typeof activeAgent.additionalInstructions === 'function'
					? activeAgent.additionalInstructions( context )
					: activeAgent.additionalInstructions;

			if (
				activeAgent.assistantId !== assistantId &&
				( activeAgent.assistantId || ! autoCreateAssistant )
			) {
				setAssistantId( activeAgent.assistantId );
			}

			// langgraph cloud only
			if ( activeAgent.graphId !== graphId ) {
				setGraphId( activeAgent.graphId );
			}

			if ( newInstructions && newInstructions !== instructions ) {
				setInstructions( newInstructions );
			}

			if ( newAdditionalInstructions !== additionalInstructions ) {
				setAdditionalInstructions( newAdditionalInstructions );
			}
		}
	}, [
		autoCreateAssistant,
		additionalInstructions,
		activeAgent,
		assistantId,
		graphId,
		setAssistantId,
		setGraphId,
		instructions,
		tools,
		context,
		toolkitsLoaded,
	] );

	useEffect( () => {
		if ( isAssistantAvailable && ! running && ! error && ! threadId ) {
			createThread();
		}
	}, [ error, isAssistantAvailable, createThread, running, threadId ] );

	useEffect( () => {
		console.warn( '🧠 createThreadRun', {
			running,
			instructions,
			isAssistantAvailable,
			isThreadRunComplete,
			isThreadDataLoaded,
			isAwaitingUserInput,
			additionalMessages,
			messages,
		} );
		if (
			! running &&
			instructions &&
			isAssistantAvailable &&
			isThreadRunComplete &&
			isThreadDataLoaded &&
			! isAwaitingUserInput &&
			additionalMessages.length > 0 &&
			messages.length > 0
		) {
			// deduplicate and convert to OpenAI format
			const openAITools = tools.map( toOpenAITool );
			createThreadRun( {
				tools: openAITools,
				instructions,
				additionalInstructions,
				// this will always be empty right now because we sync messages to the thread first, but we could use it to send additional messages
				additionalMessages,
			} );
		}
	}, [
		running,
		isAssistantAvailable,
		additionalInstructions,
		additionalMessages,
		messages.length,
		instructions,
		isAwaitingUserInput,
		isThreadRunComplete,
		createThreadRun,
		tools,
		isThreadDataLoaded,
		messages,
	] );

	/**
	 * Call agent.onStart() at the beginning
	 */
	useEffect( () => {
		if (
			isAvailable &&
			toolkitsLoaded &&
			! isAwaitingUserInput &&
			! running &&
			! loading &&
			! started &&
			messages.length === 0 &&
			activeAgent
		) {
			setAgentStarted( true );
			if ( typeof activeAgent.onStart === 'function' ) {
				activeAgent.onStart( invoke );
			}
		}
	}, [
		messages,
		agentSay,
		activeAgent,
		invoke,
		isAvailable,
		isAwaitingUserInput,
		toolkitsLoaded,
		loading,
		running,
		setAgentStarted,
		started,
	] );

	/**
	 * Run a chat completion
	 */
	useEffect( () => {
		if (
			isChatAvailable &&
			! running &&
			instructions &&
			messages.length > 0 &&
			! isAwaitingUserInput
		) {
			const openAITools = tools.map( toOpenAITool );
			runChatCompletion( {
				tools: openAITools,
				instructions,
				additionalInstructions,
			} );
		}
	}, [
		additionalInstructions,
		assistantEnabled,
		assistantMessage,
		enabled,
		error,
		messages,
		instructions,
		isAwaitingUserInput,
		isChatAvailable,
		runChatCompletion,
		running,
		tools,
	] );

	useEffect( () => {
		if ( toolOutputs.length > prevToolOutputsLength && activeAgent ) {
			const newToolOutputs = toolOutputs.slice( prevToolOutputsLength );

			newToolOutputs.forEach( ( toolOutput ) => {
				const toolCall = toolOutputs.find(
					( tc ) => tc.id === toolOutput.tool_call_id
				);

				if ( toolCall ) {
					const toolName = toolCall.toolName;
					const value = toolOutput.output;

					if ( typeof activeAgent.onToolResult === 'function' ) {
						activeAgent.onToolResult(
							toolName,
							value,
							callbacks,
							context
						);
					}
				}
			} );

			setPrevToolOutputsLength( toolOutputs.length );
		}
	}, [
		toolOutputs,
		requiredToolOutputs,
		activeAgent,
		callbacks,
		prevToolOutputsLength,
		context,
	] );
};

export default useAgentExecutor;
