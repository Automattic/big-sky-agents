/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SetGoalTool from '../ai/tools/set-goal.js';
import useToolkits from '../components/toolkits-provider/use-toolkits.js';
import useGoals from '../components/goals-provider/use-goals.js';
import GoalToolkit from '../ai/toolkits/goal-toolkit.js';

const useGoalToolkit = () => {
	const { registerToolkitCallbacks, registerToolkitContext } = useToolkits();
	const { goal, setGoal } = useGoals();

	useEffect( () => {
		registerToolkitCallbacks( GoalToolkit.name, {
			[ SetGoalTool.name ]: ( { goal: newGoal } ) => {
				setGoal( newGoal );
				return `Goal set to "${ newGoal }"`;
			},
		} );
	}, [ registerToolkitCallbacks, setGoal ] );

	useEffect( () => {
		registerToolkitContext( GoalToolkit.name, {
			agent: {
				goal,
			},
		} );
	}, [ registerToolkitContext, goal ] );
};

export default useGoalToolkit;
