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

export default function useToolkits( requestedToolkits ) {
	const toolkitsStore = useContext( Context );
	const { registerToolkit } = useDispatch( toolkitsStore );
	const toolkits = useSelect( ( select ) =>
		select( toolkitsStore )
			.getToolkits()
			.filter( ( toolkit ) => {
				if ( requestedToolkits ) {
					return requestedToolkits.includes( toolkit.name );
				}
				return true;
			} )
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

	// merged context from all toolkits
	const context = useMemo( () => {
		return toolkits.reduce( ( acc, toolkit ) => {
			const toolkitContext =
				typeof toolkit.context === 'function'
					? toolkit.context()
					: toolkit.context;
			// console.warn( 'toolkitContext', toolkitContext );
			return {
				...acc,
				...toolkitContext,
			};
		}, {} );
	}, [ toolkits ] );

	// flattened array of tools, avoiding duplicates
	const tools = useMemo( () => {
		return toolkits.reduce( ( acc, toolkit ) => {
			const toolkitTools =
				typeof toolkit.tools === 'function'
					? toolkit.tools( context )
					: toolkit.tools;
			return [
				...acc,
				...toolkitTools.filter(
					( tool ) => ! acc.some( ( t ) => t.name === tool.name )
				),
			];
		}, [] );
	}, [ toolkits, context ] );

	// console.warn( 'render context', requestedToolkits, toolkits, context );

	// toolkits are considered "loaded" when all requested toolkits are available
	// for example, some are registered on async hooks that may take several cycles/requests to resolve
	const loaded = useMemo( () => {
		if ( requestedToolkits ) {
			return requestedToolkits.every( ( requestedToolkit ) =>
				toolkits.some(
					( toolkit ) => toolkit.name === requestedToolkit
				)
			);
		}
		return true;
	}, [ requestedToolkits, toolkits ] );

	const reset = useCallback( () => {
		// call reset() on each toolkit if defined and it's a function
		toolkits.forEach( ( toolkit ) => {
			if ( toolkit.reset && typeof toolkit.reset === 'function' ) {
				toolkit.reset();
			}
		} );
	}, [ toolkits ] );

	return {
		reset,
		loaded,
		tools,
		context,
		callbacks,
		registerToolkit,
		registerDefaultToolkits,
	};
}
