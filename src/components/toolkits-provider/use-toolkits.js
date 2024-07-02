/**
 * WordPress dependencies
 */
import { useCallback, useContext, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import defaultToolkits from '../../ai/toolkits/default-toolkits';

/**
 * Internal dependencies
 */
import { Context } from './context.jsx';
import { useDispatch, useSelect } from '@wordpress/data';

export default function useToolkits() {
	const toolkitsStore = useContext( Context );
	const { registerToolkit } = useDispatch( toolkitsStore );
	const toolkits = useSelect( ( select ) =>
		select( toolkitsStore ).getTookits()
	);

	const registerDefaultToolkits = useCallback( () => {
		defaultToolkits.forEach( ( tool ) => {
			registerToolkit( tool );
		} );
	}, [ registerToolkit ] );

	// used to actually call the tool, e.g. callbacks.getWeather( { location: "Boston, MA" } )
	const callbacks = useMemo( () => {
		return toolkits?.reduce( ( acc, toolkit ) => {
			const toolkitCallbacks =
				typeof toolkit.callbacks === 'function'
					? toolkit.callbacks()
					: toolkit.callbacks;
			return {
				...acc,
				...toolkitCallbacks,
			};
		}, {} );
	}, [ toolkits ] );

	const context = useMemo( () => {
		return {
			tools: toolkits,
			callbacks,
		};
	}, [ toolkits, callbacks ] );

	const tools = useMemo( () => {
		return toolkits.reduce( ( acc, toolkit ) => {
			return [
				...acc,
				...toolkit.tools.filter(
					( tool ) => ! acc.some( ( t ) => t.name === tool.name )
				),
			];
		}, [] );
	}, [ toolkits ] );

	return {
		tools,
		context,
		callbacks,
		registerToolkit,
		registerDefaultToolkits,
	};
}
