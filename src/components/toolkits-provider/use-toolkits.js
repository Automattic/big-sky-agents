/**
 * WordPress dependencies
 */
import { useCallback, useContext, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import defaultToolkits from '../../ai/toolkits/default-toolkits';
import useAgents from '../agents-provider/use-agents';

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
	const { activeAgent } = useAgents();
	const {
		registerToolkit,
		registerToolkitCallbacks,
		registerToolkitContext,
		registerToolkitTools,
	} = useDispatch( toolkitsStore );
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

			if ( ! toolkitContext ) {
				return acc;
			}

			const result = deepMerge( acc, toolkitContext );
			return result;
		}, {} );
	}, [ toolkits ] );

	// flattened array of tools, avoiding duplicates
	// tools work like this:
	// - if the agent has a tools() function, it's called with the context and all toolkit tools
	// - if the agent has a tools property, it's used as-is
	// - tools that are strings (e.g. 'askUser') are resolved to the same-named toolkit tool
	// - tools that are objects are used as-is
	// - agents with no tools property will use all toolkit tools
	const tools = useMemo( () => {
		if ( ! activeAgent ) {
			return [];
		}
		const agentToolkits =
			typeof activeAgent.toolkits === 'function'
				? activeAgent.toolkits()
				: activeAgent.toolkits;

		const allToolkitTools = agentToolkits.reduce( ( acc, toolkit ) => {
			// if the toolkit is a string, look up the instance
			if ( typeof toolkit === 'string' ) {
				toolkit = toolkits.find( ( t ) => t.name === toolkit );
			}

			if ( ! toolkit ) {
				// if the toolkit can't be found, it might not be registered yet.
				// we rely on the hasToolkits function to check if the required toolkits are loaded
				// before making the agent interactive
				return acc;
			}

			const toolkitTools =
				typeof toolkit.tools === 'function'
					? toolkit.tools()
					: toolkit.tools;

			if ( ! toolkitTools ) {
				return acc;
			}

			return [
				...acc,
				// deduplicate
				...toolkitTools.filter(
					( tool ) => ! acc.some( ( t ) => t.name === tool.name )
				),
			];
		}, [] );

		const agentTools =
			typeof activeAgent.tools === 'function'
				? activeAgent.tools( context, allToolkitTools )
				: activeAgent.tools;

		if ( ! agentTools ) {
			return allToolkitTools;
		}

		// remap string values to the same-named toolkit tool
		const resolvedToolkitTools = agentTools.map( ( tool ) => {
			if ( typeof tool === 'string' ) {
				return allToolkitTools.find( ( t ) => t.name === tool );
			}
			return tool;
		} );

		return resolvedToolkitTools;
	}, [ activeAgent, context, toolkits ] );

	// used to pretend the agent invoked something, e.g. invoke.askUser( { question: "What would you like to do next?" } )
	const invoke = useMemo( () => {
		return tools.reduce( ( acc, tool ) => {
			acc[ tool.name ] = ( args, id ) => call( tool.name, args, id );
			return acc;
		}, {} );
	}, [ call, tools ] );

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
		registerToolkitCallbacks,
		registerToolkitContext,
		registerToolkitTools,
		registerDefaultToolkits,
	};
}
