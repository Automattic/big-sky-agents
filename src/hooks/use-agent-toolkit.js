/**
 * WordPress dependencies
 */
import { useCallback, useEffect } from '@wordpress/element';

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
	const { registerToolkit } = useToolkits();

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
		setAgentThought,
		setAgentGoal,
		setActiveAgent,
		reset,
		registerToolkit,
	] );
};

export default useAgentToolkit;
