/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useToolkits from '../components/toolkits-provider/use-toolkits.js';

const useToolkit = ( { toolkit } ) => {
	const { registerToolkit } = useToolkits();

	useEffect( () => {
		registerToolkit( toolkit );
	}, [ registerToolkit, toolkit ] );
};

export default useToolkit;
