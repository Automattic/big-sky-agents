import { useContext } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { Context } from './context.jsx';

function useGoals() {
	const goalsStore = useContext( Context );

	const { setGoal } = useDispatch( goalsStore );
	const goal = useSelect( ( select ) => select( goalsStore ).getGoal() );

	return {
		goal,
		setGoal,
	};
}

export default useGoals;
