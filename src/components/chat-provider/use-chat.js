/**
 * WordPress dependencies
 */
import {
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { Context } from './context';
import useTools from '../tools-provider/use-tools';
import useAgents from '../agents-provider/use-agents';
// import useCurrentAgent from '../../hooks/use-current-agent';

const toOpenAITool = ( tool ) => ( {
	type: 'function',
	function: {
		name: tool.name,
		description: tool.description,
		parameters: tool.parameters,
	},
} );

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
 * } from '@automattic/big-sky-agents';
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

export default function useChat( options ) {
	const agentStore = useContext( Context );
	const { callbacks, tools: allTools } = useTools();
	const { activeAgent, agents, activeAgentId } = useAgents();
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
	} = useDispatch( agentStore );

	const {
		apiKey,
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
		isThreadRunInProgress,
		isThreadDataLoaded,
		feature,
	} = useSelect( ( select ) => {
		return {
			apiKey: select( agentStore ).getApiKey(),
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
			isThreadRunInProgress: select( agentStore ).isThreadRunInProgress(),
			isThreadDataLoaded: select( agentStore ).isThreadDataLoaded(),
			feature: select( agentStore ).getFeature(),
		};
	} );

	// if chat.apiKey !== apiKey, set it
	useEffect( () => {
		if ( options?.apiKey !== apiKey ) {
			setApiKey( apiKey );
		}
	}, [ apiKey, options?.apiKey, setApiKey ] );

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
		isAssistantAvailable,
		runGetThreadMessages,
		running,
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
		if ( ! error && ! running && pendingToolCalls.length > 0 ) {
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
	}, [ error, callbacks, pendingToolCalls, running, setToolCallResult ] );

	// used to pretend the agent invoked something, e.g. invoke.askUser( { question: "What would you like to do next?" } )
	const invoke = useMemo( () => {
		return allTools.reduce( ( acc, tool ) => {
			acc[ tool.name ] = ( args, id ) =>
				addToolCall( tool.name, args, id );
			return acc;
		}, {} );
	}, [ addToolCall, allTools ] );

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
	] );

	useEffect( () => {
		if ( activeAgent ) {
			const context = {}; // for now, we don't need any context
			/**
			 * Compute new state
			 */

			let newTools =
				typeof activeAgent.tools === 'function'
					? activeAgent.tools( context )
					: activeAgent.tools;

			if ( ! newTools ) {
				// use all tools
				newTools = allTools;
			}

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
				console.warn( '🧠 System prompt', newInstructions );
				setInstructions( newInstructions );
			}

			if ( newAdditionalInstructions !== additionalInstructions ) {
				console.warn(
					'🧠 Next step prompt',
					newAdditionalInstructions
				);
				setAdditionalInstructions( newAdditionalInstructions );
			}

			if ( JSON.stringify( newTools ) !== JSON.stringify( tools ) ) {
				console.warn( '🧠 Tools', newTools );
				setTools( newTools.map( toOpenAITool ) );
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
	] );

	const runChat = useCallback( () => {
		if (
			! instructions ||
			! enabled || // disabled
			running || // already running
			error || // there's an error
			! history.length > 0 || // nothing to process
			isAwaitingUserInput
		) {
			return;
		}
		runChatCompletion( {
			tools,
			instructions,
			additionalInstructions,
		} );
	}, [
		instructions,
		enabled,
		running,
		error,
		history.length,
		isAwaitingUserInput,
		runChatCompletion,
		tools,
		additionalInstructions,
	] );

	const createThreadRun = useCallback( () => {
		if (
			! isThreadRunComplete ||
			isAwaitingUserInput ||
			additionalMessages.length > 0 ||
			history.length === 0
		) {
			return;
		}

		runCreateThreadRun( {
			tools,
			instructions,
			additionalInstructions,
			// this will always be empty right now because we sync messages to the thread first, but we could use it to send additional messages
			additionalMessages,
		} );
	}, [
		additionalInstructions,
		additionalMessages,
		history.length,
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
	// 	if ( onStart && ! running && ! loading && ! started ) {
	// 		onStart();
	// 	}
	// }, [ running, started, loading, onStart ] );

	const onStart = useCallback( () => {
		console.log( 'onStart', agents, activeAgent, activeAgentId );
		if ( activeAgent ) {
			activeAgent.onStart( invoke );
		}
	}, [ activeAgent, invoke, activeAgentId ] );

	return {
		// running state
		enabled,
		setEnabled,
		loading,
		running,
		started,
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
		threadRun,
		setAssistantId,

		createThreadRun, // run a thread
		updateThreadRun: runGetThreadRun, // refresh status of running threads
		updateThreadRuns: runGetThreadRuns, // refresh status of running threads
		updateThreadMessages: runGetThreadMessages,
		isThreadRunComplete,
		isAwaitingUserInput,
		additionalMessages,

		onReset: reset,
		onStart,
		invoke,
	};
}
