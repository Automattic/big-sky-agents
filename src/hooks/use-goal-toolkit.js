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
import GoalToolkit from '../ai/toolkits/goal-toolkit.js';

const useGoalToolkit = () => {
	const { registerToolkitCallbacks, registerToolkitContext } = useToolkits();
	const { goal, setAgentGoal } = useAgents();

	useEffect( () => {
		registerToolkitCallbacks( GoalToolkit.name, {
			[ SetGoalTool.name ]: ( { goal: newGoal } ) => {
				setAgentGoal( newGoal );
				return `Goal set to "${ newGoal }"`;
			},
		} );
	}, [ registerToolkitCallbacks, setAgentGoal ] );

	useEffect( () => {
		registerToolkitContext( GoalToolkit.name, {
			agent: {
				goal,
			},
		} );
	}, [ registerToolkitContext, goal ] );
};

export default useGoalToolkit;
