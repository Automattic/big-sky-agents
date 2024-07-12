/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useToolkits from '../components/toolkits-provider/use-toolkits.js';
import ConfirmToolkit from '../ai/toolkits/confirm-toolkit.js';

const useConfirmToolkit = () => {
	const { registerToolkit } = useToolkits();

	useEffect( () => {
		registerToolkit( ConfirmToolkit );
	}, [ registerToolkit ] );
};

export default useConfirmToolkit;
