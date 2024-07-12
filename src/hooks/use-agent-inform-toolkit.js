/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SetGoalTool from '../ai/tools/set-goal.js';
import useToolkits from '../components/toolkits-provider/use-toolkits.js';
import useAgents from '../components/agents-provider/use-agents.js';

const AGENT_GOAL_TOOLKIT_NAME = 'agent-goal';

const useAgentGoalToolkit = () => {
	const { registerToolkitCallbacks, registerToolkitContext } = useToolkits();
	const { goal, setAgentGoal } = useAgents();

	useEffect( () => {
		registerToolkitCallbacks( AGENT_GOAL_TOOLKIT_NAME, {
			[ SetGoalTool.name ]: ( { goal: newGoal } ) => {
				setAgentGoal( newGoal );
				return `Goal set to "${ newGoal }"`;
			},
		} );
	}, [ registerToolkitCallbacks, setAgentGoal ] );

	useEffect( () => {
		registerToolkitContext( AGENT_GOAL_TOOLKIT_NAME, {
			agent: {
				goal,
			},
		} );
	}, [ registerToolkitContext, goal ] );
};

export default useAgentGoalToolkit;
