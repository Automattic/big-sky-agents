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
	const { setCallbacks, setContext } = useToolkits();
	const { goal, setGoal } = useGoals();

	useEffect( () => {
		setCallbacks( GoalToolkit.name, {
			[ SetGoalTool.name ]: ( { goal: newGoal } ) => {
				setGoal( newGoal );
				return `Goal set to "${ newGoal }"`;
			},
		} );
	}, [ setCallbacks, setGoal ] );

	useEffect( () => {
		setContext( GoalToolkit.name, {
			agent: {
				goal,
			},
		} );
	}, [ setContext, goal ] );
};

export default useGoalToolkit;
