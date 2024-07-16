/**
 * WordPress dependencies
 */
import { useCallback, useContext, useMemo } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';

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

function resolveAgentToolkits( agent, allToolkits ) {
	const toolkits =
		typeof agent.toolkits === 'function'
			? agent.toolkits()
			: agent.toolkits;

	const resolvedToolkits =
		toolkits?.map( ( toolkit ) => {
			if ( typeof toolkit === 'string' ) {
				return allToolkits.find( ( t ) => t.name === toolkit );
			}
			return toolkit;
		} ) ?? [];

	return resolvedToolkits;
}

function resolveToolkitTools( toolkits, context ) {
	return (
		toolkits?.reduce( ( acc, toolkit ) => {
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
					? toolkit.tools( context )
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
		}, [] ) ?? []
	);
}

function resolveAgentTools( agent, context, allTools ) {
	const tools =
		typeof agent.tools === 'function'
			? agent.tools( context, allTools )
			: agent.tools;

	// remap string values to the same-named toolkit tool
	const resolvedTools = tools?.map( ( tool ) => {
		if ( typeof tool === 'string' ) {
			return allTools.find( ( t ) => t.name === tool );
		}
		return tool;
	} );

	return resolvedTools ?? allTools;
}

export default function useToolkits() {
	const toolkitsStore = useContext( Context );
	const { activeAgent } = useAgents();
	const { registerToolkit, setCallbacks, setContext, setTools } =
		useDispatch( toolkitsStore );
	const { call, agentSay, userSay } = useChat();
	const registeredToolkits = useSelect( ( select ) =>
		select( toolkitsStore ).getToolkits()
	);

	const registerDefaultToolkits = useCallback( () => {
		defaultToolkits.forEach( ( tool ) => {
			registerToolkit( tool );
		} );
	}, [ registerToolkit ] );

	const agentToolkits = useMemo( () => {
		if ( ! activeAgent ) {
			return [];
		}
		// the agents toolkits are the ones that are required by the agent, whether using a string (therefore looked up) or as an instance
		return resolveAgentToolkits( activeAgent, registeredToolkits );
	}, [ activeAgent, registeredToolkits ] );

	// used to actually call the tool, e.g. callbacks.getWeather( { location: "Boston, MA" } )
	const callbacks = useMemo( () => {
		return agentToolkits?.reduce( ( acc, toolkit ) => {
			const toolkitCallbacks =
				typeof toolkit.callbacks === 'function'
					? toolkit.callbacks()
					: toolkit.callbacks;
			return {
				...acc,
				...toolkitCallbacks,
			};
		}, {} );
	}, [ agentToolkits ] );

	// merged context from all toolkits
	const context = useMemo( () => {
		return agentToolkits.reduce( ( acc, toolkit ) => {
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
	}, [ agentToolkits ] );

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

		// get the full set of tools from those toolkits
		const toolkitTools = resolveToolkitTools( agentToolkits, context );
		// get the subset of tools, if any, that the agent chooses
		const agentTools = resolveAgentTools(
			activeAgent,
			context,
			toolkitTools
		);

		return agentTools;
	}, [ activeAgent, agentToolkits, context ] );

	// used to pretend the agent invoked something, e.g. invoke.askUser( { question: "What would you like to do next?" } )
	const invoke = useMemo( () => {
		const invokeTools = tools.reduce( ( acc, tool ) => {
			acc[ tool.name ] = ( args, id ) => call( tool.name, args, id );
			return acc;
		}, {} );
		return {
			...invokeTools,
			userSay,
			agentSay,
		};
	}, [ agentSay, call, tools, userSay ] );

	const hasToolkits = useCallback(
		( requestedToolkits ) => {
			return requestedToolkits.every( ( requestedToolkit ) => {
				if ( typeof requestedToolkit === 'string' ) {
					return agentToolkits.some(
						( toolkit ) => toolkit.name === requestedToolkit
					);
				}
				return true;
			} );
		},
		[ agentToolkits ]
	);

	const reset = useCallback( () => {
		// call reset() on each toolkit if defined and it's a function
		agentToolkits.forEach( ( toolkit ) => {
			if ( toolkit.reset && typeof toolkit.reset === 'function' ) {
				toolkit.reset();
			}
		} );
	}, [ agentToolkits ] );

	return {
		reset,
		hasToolkits,
		tools,
		context,
		invoke,
		callbacks,
		registerToolkit,
		setCallbacks,
		setContext,
		setTools,
		registerDefaultToolkits,
	};
}
