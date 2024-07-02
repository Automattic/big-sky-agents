/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import InformTool from '../ai/tools/inform-user.js';
import createSetAgentTool, {
	SET_AGENT_TOOL_NAME,
} from '../ai/tools/set-agent.js';
import AskUserTool from '../ai/tools/ask-user.js';
import SetGoalTool from '../ai/tools/set-goal.js';
import useAgents from '../components/agents-provider/use-agents.js';
import useChat from '../components/chat-provider/use-chat.js';
import useToolkits from '../components/toolkits-provider/use-toolkits.js';

const useAgentToolkit = () => {
	const {
		agents,
		activeAgent,
		setActiveAgent,
		thought,
		setAgentThought,
		goal,
		setAgentGoal,
		started,
		setAgentStarted,
	} = useAgents();
	const { call, loading, running, isAvailable, isAwaitingUserInput } =
		useChat();

	const {
		tools: allTools,
		loaded,
		registerToolkit,
	} = useToolkits( activeAgent?.toolkits );

	const tools = useMemo(
		() => [
			AskUserTool,
			SetGoalTool,
			InformTool,
			createSetAgentTool( agents ),
		],
		[ agents ]
	);

	// used to pretend the agent invoked something, e.g. invoke.askUser( { question: "What would you like to do next?" } )
	const invoke = useMemo( () => {
		return allTools.reduce( ( acc, tool ) => {
			acc[ tool.name ] = ( args, id ) => call( tool.name, args, id );
			return acc;
		}, {} );
	}, [ call, allTools ] );

	const onReset = useCallback( () => {
		setAgentGoal( null );
		setAgentThought( null );
	}, [ setAgentGoal, setAgentThought ] );

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
			console.warn( '🚀 Starting agent', { invoke } );
			setAgentStarted( true );
			activeAgent.onStart( invoke );
		} else {
			console.warn( '🚀 Not starting agent', {
				loaded,
				isAvailable,
				isAwaitingUserInput,
				running,
				loading,
				started,
				activeAgent,
			} );
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

	useEffect( () => {
		registerToolkit( {
			name: 'agents',
			tools,
			callbacks: {
				[ InformTool.name ]: ( { message } ) => {
					setAgentThought( message );
					return message
						? `Agent thinks: "${ message }"`
						: 'Thought cleared';
				},
				[ SetGoalTool.name ]: ( { goal: newGoal } ) => {
					setAgentGoal( newGoal );
					return `Goal set to "${ newGoal }"`;
				},
				[ SET_AGENT_TOOL_NAME ]: ( { agentId } ) => {
					setActiveAgent( agentId );
					return `Agent set to ${ agentId }`;
				},
			},
			context: {
				agents,
				agent: {
					id: activeAgent?.id,
					name: activeAgent?.name,
					assistantId: activeAgent?.assistantId,
					goal,
					thought,
				},
			},
			reset: onReset,
		} );
	}, [
		agents,
		activeAgent,
		goal,
		thought,
		registerToolkit,
		tools,
		invoke,
		setAgentThought,
		setAgentGoal,
		setActiveAgent,
		onReset,
	] );
};

export default useAgentToolkit;
