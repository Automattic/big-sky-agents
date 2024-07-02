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

const useAgentExecutor = () => {
	const { activeAgent, started, setAgentStarted } = useAgents();

	const {
		messages,
		isAssistantAvailable,
		isChatAvailable,
		call,
		loading,
		running,
		isAvailable,
		isAwaitingUserInput,
		isThreadRunAwaitingToolOutputs,
		isThreadRunInProgress,
		isThreadRunComplete,
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
		setAssistantId,
	} = useChat();

	const {
		tools: allTools,
		loaded,
		context,
		callbacks,
	} = useToolkits( activeAgent?.toolkits );

	const [ tools, setTools ] = useState( [] );
	const [ instructions, setInstructions ] = useState( '' );
	const [ additionalInstructions, setAdditionalInstructions ] =
		useState( '' );

	// used to pretend the agent invoked something, e.g. invoke.askUser( { question: "What would you like to do next?" } )
	const invoke = useMemo( () => {
		return allTools.reduce( ( acc, tool ) => {
			acc[ tool.name ] = ( args, id ) => call( tool.name, args, id );
			return acc;
		}, {} );
	}, [ call, allTools ] );

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
		updateThreadRuns,
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
			updateThreadMessages();
		}
	}, [
		isAssistantAvailable,
		updateThreadMessages,
		running,
		threadId,
		threadMessagesUpdated,
		threadRun,
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
				if ( tool_call.inProgress ) {
					return;
				}

				if ( tool_call.error ) {
					throw new Error( tool_call.error );
				}

				// parse arguments if they're a string
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
					 * I assume the result is supposed to be an array...
					 */
					// create an array of promises for the tool uses
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

					// set to tool result to the promise
					setToolResult( tool_call.id, Promise.all( promises ) );
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
		if ( ! running && isThreadRunInProgress ) {
			const interval = setInterval( () => {
				updateThreadRun();
			}, 1000 );
			return () => clearInterval( interval );
		}
	}, [ updateThreadRun, isThreadRunInProgress, running ] );

	// if there are pendingThreadMessages, send them using addMessageToThread
	useEffect( () => {
		if (
			isAssistantAvailable &&
			! running &&
			isThreadRunComplete &&
			additionalMessages.length > 0
		) {
			addMessageToThread( {
				message: additionalMessages[ 0 ],
			} );
		}
	}, [
		running,
		additionalMessages,
		isThreadRunComplete,
		addMessageToThread,
		isAssistantAvailable,
	] );

	useEffect( () => {
		if ( activeAgent && loaded ) {
			let newTools =
				typeof activeAgent.tools === 'function'
					? activeAgent.tools( context )
					: activeAgent.tools;

			// for any tools that are a string, look up the definition from allTools by name

			if ( ! newTools ) {
				// use all tools if none specified
				newTools = allTools;
			}

			// map string tools to globally registered tool definitions
			newTools = newTools
				.map( ( tool ) => {
					if ( typeof tool === 'string' ) {
						const registeredTool = allTools.find(
							( t ) => t.name === tool
						);
						if ( ! registeredTool ) {
							console.warn( '🧠 Tool not found', tool );
						}
						return registeredTool;
					}
					return tool;
				} )
				.filter( Boolean );

			// remap to an OpenAI tool
			newTools = newTools.map( ( tool ) => ( {
				type: 'function',
				function: {
					name: tool.name,
					description: tool.description,
					parameters: tool.parameters,
				},
			} ) );

			const newInstructions =
				typeof activeAgent.instructions === 'function'
					? activeAgent.instructions( context )
					: activeAgent.instructions;

			const newAdditionalInstructions =
				typeof activeAgent.additionalInstructions === 'function'
					? activeAgent.additionalInstructions( context )
					: activeAgent.additionalInstructions;

			if ( activeAgent.assistantId !== assistantId ) {
				setAssistantId( activeAgent.assistantId );
			}

			if ( newInstructions && newInstructions !== instructions ) {
				setInstructions( newInstructions );
			}

			if ( newAdditionalInstructions !== additionalInstructions ) {
				setAdditionalInstructions( newAdditionalInstructions );
			}

			if ( JSON.stringify( newTools ) !== JSON.stringify( tools ) ) {
				setTools( newTools );
			}
		}
	}, [
		additionalInstructions,
		activeAgent,
		assistantId,
		setAssistantId,
		instructions,
		tools,
		allTools,
		context,
		loaded,
	] );

	useEffect( () => {
		if ( isAssistantAvailable && ! running && ! error && ! threadId ) {
			createThread();
		}
	}, [ error, isAssistantAvailable, createThread, running, threadId ] );

	useEffect( () => {
		if (
			instructions &&
			isAssistantAvailable &&
			isThreadRunComplete &&
			! isAwaitingUserInput &&
			additionalMessages.length === 0 &&
			messages.length > 0
		) {
			createThreadRun( {
				tools,
				instructions,
				additionalInstructions,
				// this will always be empty right now because we sync messages to the thread first, but we could use it to send additional messages
				additionalMessages,
			} );
		}
	}, [
		isAssistantAvailable,
		additionalInstructions,
		additionalMessages,
		messages.length,
		instructions,
		isAwaitingUserInput,
		isThreadRunComplete,
		createThreadRun,
		tools,
	] );

	/**
	 * Call agent.onStart() at the beginning
	 */
	useEffect( () => {
		if (
			isAvailable &&
			loaded &&
			! isAwaitingUserInput &&
			! running &&
			! loading &&
			! started &&
			activeAgent &&
			activeAgent.onStart
		) {
			setAgentStarted( true );
			activeAgent.onStart( invoke );
		}
	}, [
		activeAgent,
		invoke,
		isAvailable,
		isAwaitingUserInput,
		loaded,
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
			runChatCompletion( {
				tools,
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
};

export default useAgentExecutor;
