/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import InformUserTool from '../ai/tools/inform-user.js';
import useToolkits from '../components/toolkits-provider/use-toolkits.js';
import useThought from '../components/thought-provider/use-thought.js';
import InformToolkit from '../ai/toolkits/inform-toolkit.js';

const useInformToolkit = () => {
	const { registerToolkitCallbacks, registerToolkitContext } = useToolkits();
	const { thought, setThought } = useThought();

	useEffect( () => {
		registerToolkitCallbacks( InformToolkit.name, {
			[ InformUserTool.name ]: ( { message: newThought } ) => {
				setThought( newThought );
				return `Assistant thinks "${ newThought }"`;
			},
		} );
	}, [ registerToolkitCallbacks, setThought ] );

	useEffect( () => {
		registerToolkitContext( InformToolkit.name, {
			agent: {
				thought,
			},
		} );
	}, [ registerToolkitContext, thought ] );
};

export default useInformToolkit;
