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
	const { setCallbacks, setContext } = useToolkits();
	const { thought, setThought } = useThought();

	useEffect( () => {
		setCallbacks( InformToolkit.name, {
			[ InformUserTool.name ]: ( { message: newThought } ) => {
				setThought( newThought );
				return `Assistant thinks "${ newThought }"`;
			},
		} );
	}, [ setCallbacks, setThought ] );

	useEffect( () => {
		setContext( InformToolkit.name, {
			agent: {
				thought,
			},
		} );
	}, [ setContext, thought ] );
};

export default useInformToolkit;
