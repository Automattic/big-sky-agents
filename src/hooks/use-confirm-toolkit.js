/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useToolkits from '../components/toolkits-provider/use-toolkits.js';
import { ConfirmTool } from '../index.js';

export const CONFIRM_TOOLKIT_ID = 'confirm';

const useConfirmToolkit = () => {
	const { registerToolkit } = useToolkits();

	useEffect( () => {
		registerToolkit( {
			name: CONFIRM_TOOLKIT_ID,
			tools: [ ConfirmTool ],
		} );
	}, [ registerToolkit ] );
};

export default useConfirmToolkit;
