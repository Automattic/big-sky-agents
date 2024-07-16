import { useContext } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { Context } from './context.jsx';

function useThought() {
	const thoughtStore = useContext( Context );

	const { setThought } = useDispatch( thoughtStore );
	const thought = useSelect( ( select ) =>
		select( thoughtStore ).getThought()
	);

	return {
		thought,
		setThought,
	};
}

export default useThought;
