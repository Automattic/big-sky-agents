/**
 * WordPress dependencies
 */
import { useContext, useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { Context } from './context.jsx';

const useToolkit = ( toolkit ) => {
	const toolkitsStore = useContext( Context );
	const { registerToolkit } = useDispatch( toolkitsStore );

	useEffect( () => {
		registerToolkit( toolkit );
	}, [ registerToolkit, toolkit ] );
};

export default useToolkit;
