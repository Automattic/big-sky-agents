/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import AskUserToolkit from '../ai/toolkits/ask-user-toolkit.js';
import useToolkits from '../components/toolkits-provider/use-toolkits.js';

const useAskUserToolkit = () => {
	const { registerToolkit } = useToolkits();

	useEffect( () => {
		registerToolkit( AskUserToolkit );
	}, [ registerToolkit ] );
};

export default useAskUserToolkit;
