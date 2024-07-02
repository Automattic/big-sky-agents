/**
 * WordPress dependencies
 */
import { useContext, useEffect, useMemo, useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { Context } from './context';
import useToolkits from '../toolkits-provider/use-toolkits';
import useAgents from '../agents-provider/use-agents';

const toOpenAITool = ( tool ) => {
	console.warn( '🧠 toOpenAITool', tool );
	return {
		type: 'function',
		function: {
			name: tool.name,
			description: tool.description,
			parameters: tool.parameters,
		},
	};
};

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
	const { activeAgent, agents } = useAgents();
	const {
		loaded: toolkitsLoaded,
		context,
		callbacks,
		tools: allTools,
	} = useToolkits( activeAgent?.toolkits );
	const [ tools, setTools ] = useState( [] );
	const [ instructions, setInstructions ] = useState( '' );
	const [ additionalInstructions, setAdditionalInstructions ] =
		useState( '' );

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

			runSubmitToolOutputs( {
				toolOutputs: filteredToolOutputs,
			} );
		}
	}, [
		isThreadRunAwaitingToolOutputs,
		requiredToolOutputs,
		runSubmitToolOutputs,
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
					// console.error( '⚙️ Tool call error', tool_call.error );
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
					setToolCallResult( tool_call.id, Promise.all( promises ) );
				}

				const callback = callbacks[ tool_call.function.name ];

				if ( typeof callback === 'function' ) {
					console.warn( '🧠 Tool callback', tool_call.function.name );
					setToolCallResult( tool_call.id, callback( args ) );
				}
			} );
		}
	}, [
		callbacks,
		error,
		isAvailable,
		pendingToolCalls,
		running,
		setToolCallResult,
	] );

	// while threadRun.status is queued or in_progress, poll for thread run status
	useEffect( () => {
		if ( ! running && isThreadRunInProgress ) {
			const interval = setInterval( () => {
				runGetThreadRun();
			}, 1000 );
			return () => clearInterval( interval );
		}
	}, [ runGetThreadRun, isThreadRunInProgress, running ] );

	// if there are pendingThreadMessages, send them using runAddMessageToThread
	useEffect( () => {
		if (
			isAssistantAvailable &&
			! running &&
			isThreadRunComplete &&
			additionalMessages.length > 0
		) {
			runAddMessageToThread( {
				message: additionalMessages[ 0 ],
			} );
		}
	}, [
		running,
		additionalMessages,
		isThreadRunComplete,
		runAddMessageToThread,
		isAssistantAvailable,
	] );

	useEffect( () => {
		if ( activeAgent && toolkitsLoaded ) {
			// const context = {
			// 	agents,
			// 	agent: {
			// 		goal: 'test',
			// 	},
			// }; // for now, we don't need any context
			/**
			 * Compute new state
			 */

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

			// remap using toOpenAITool
			newTools = newTools.map( toOpenAITool );

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
		agents,
		context,
		toolkitsLoaded,
	] );

	useEffect( () => {
		console.warn( 'run chat completion', {
			isChatAvailable,
			enabled,
			service,
			apiKey,
			running,
			error,
			instructions,
			additionalInstructions,
			tools,
			messages,
			isAwaitingUserInput,
			assistantMessage,
			pendingToolCalls,
		} );
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
		model,
		pendingToolCalls,
		runChatCompletion,
		running,
		service,
		tools,
		apiKey,
	] );

	useEffect( () => {
		if ( isAssistantAvailable && ! running && ! error && ! threadId ) {
			runCreateThread();
		} else {
			console.warn( 'not creating thread', {
				isAssistantAvailable,
				running,
				error,
				threadId,
			} );
		}
	}, [ error, isAssistantAvailable, runCreateThread, running, threadId ] );

	useEffect( () => {
		if (
			instructions &&
			isAssistantAvailable &&
			isThreadRunComplete &&
			! isAwaitingUserInput &&
			additionalMessages.length === 0 &&
			messages.length > 0
		) {
			runCreateThreadRun( {
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
		runCreateThreadRun,
		tools,
	] );

	// /**
	//  * Call agent.onStart() at the beginning
	//  */
	// useEffect( () => {
	// 	if (
	// 		isAvailable &&
	// 		toolkitsLoaded &&
	// 		! isAwaitingUserInput &&
	// 		! running &&
	// 		! loading &&
	// 		! started &&
	// 		activeAgent &&
	// 		activeAgent.onStart
	// 	) {
	// 		console.warn( '🚀 Starting agent', { invoke } );
	// 		setStarted( true );
	// 		activeAgent.onStart( invoke );
	// 	} else {
	// 		console.warn( '🚀 Not starting agent', {
	// 			toolkitsLoaded,
	// 			isAvailable,
	// 			isAwaitingUserInput,
	// 			running,
	// 			loading,
	// 			started,
	// 			activeAgent,
	// 			assistantEnabled,
	// 			service,
	// 			apiKey,
	// 			error,
	// 		} );
	// 	}
	// }, [
	// 	activeAgent,
	// 	apiKey,
	// 	assistantEnabled,
	// 	error,
	// 	invoke,
	// 	isAvailable,
	// 	isAwaitingUserInput,
	// 	loading,
	// 	running,
	// 	service,
	// 	setStarted,
	// 	started,
	// 	toolkitsLoaded,
	// ] );

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

		// assistants
		threadId,
		deleteThread: runDeleteThread,
		assistantId,
		threadRun,
		setAssistantId,

		updateThreadRun: runGetThreadRun, // refresh status of running threads
		updateThreadRuns: runGetThreadRuns, // refresh status of running threads
		isAvailable,
		isThreadRunComplete,
		isAwaitingUserInput,
		additionalMessages,

		onReset: reset,
	};
}
