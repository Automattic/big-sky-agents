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
	} = useAgents();

	const { call } = useChat();

	const { tools: allTools, registerToolkit } = useToolkits(
		activeAgent?.toolkits
	);

	// used to pretend the agent invoked something, e.g. invoke.askUser( { question: "What would you like to do next?" } )
	const invoke = useMemo( () => {
		return allTools.reduce( ( acc, tool ) => {
			acc[ tool.name ] = ( args, id ) => call( tool.name, args, id );
			return acc;
		}, {} );
	}, [ call, allTools ] );

	const reset = useCallback( () => {
		setAgentGoal( null );
		setAgentThought( null );
	}, [ setAgentGoal, setAgentThought ] );

	useEffect( () => {
		registerToolkit( {
			name: 'agents',
			tools: [
				AskUserTool,
				SetGoalTool,
				InformTool,
				createSetAgentTool( agents ),
			],
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
			reset,
		} );
	}, [
		agents,
		activeAgent,
		goal,
		thought,
		registerToolkit,
		invoke,
		setAgentThought,
		setAgentGoal,
		setActiveAgent,
		reset,
	] );
};

export default useAgentToolkit;
