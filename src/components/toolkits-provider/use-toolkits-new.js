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
import useChat from '../chat-provider/use-chat.js';
import { useDispatch, useSelect } from '@wordpress/data';

function deepMerge( target, source ) {
	if ( typeof target !== 'object' || typeof source !== 'object' ) {
		return source;
	}

	for ( const key in source ) {
		if ( source.hasOwnProperty( key ) ) {
			if ( source[ key ] instanceof Array ) {
				if ( ! target[ key ] ) {
					target[ key ] = [];
				}
				target[ key ] = target[ key ].concat( source[ key ] );
			} else if ( source[ key ] instanceof Object ) {
				if ( ! target[ key ] ) {
					target[ key ] = {};
				}
				target[ key ] = deepMerge( target[ key ], source[ key ] );
			} else {
				target[ key ] = source[ key ];
			}
		}
	}
	return target;
}

export default function useToolkits() {
	const toolkitsStore = useContext( Context );
	const { registerToolkit } = useDispatch( toolkitsStore );
	const { call } = useChat();
	const toolkits = useSelect( ( select ) =>
		select( toolkitsStore ).getToolkits()
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
			return deepMerge( acc, toolkitContext );
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

	// used to pretend the agent invoked something, e.g. invoke.askUser( { question: "What would you like to do next?" } )
	// const invoke = useMemo( () => {
	// 	return tools.reduce( ( acc, tool ) => {
	// 		acc[ tool.name ] = ( args, id ) => call( tool.name, args, id );
	// 		return acc;
	// 	}, {} );
	// }, [ call, tools ] );

	// allow any tool name, even if it's not in the tools list
	// this is because agents may add additional tools that are not in the toolkit
	const invoke = useMemo( () => {
		return new Proxy(
			{},
			{
				get: ( target, prop ) => {
					return ( args, id ) => call( prop, args, id );
				},
			}
		);
	}, [ call ] );

	const hasToolkits = useCallback(
		( requestedToolkits ) => {
			return requestedToolkits.every( ( requestedToolkit ) =>
				toolkits.some(
					( toolkit ) => toolkit.name === requestedToolkit
				)
			);
		},
		[ toolkits ]
	);

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
		hasToolkits,
		tools,
		context,
		invoke,
		callbacks,
		registerToolkit,
		registerDefaultToolkits,
	};
}
