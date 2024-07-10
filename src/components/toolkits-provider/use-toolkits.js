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

export default function useToolkits() {
	const toolkitsStore = useContext( Context );
	const { registerToolkit } = useDispatch( toolkitsStore );
	const { call, setToolCallResult } = useChat();
	const toolkits = useSelect( ( select ) =>
		select( toolkitsStore ).getToolkits()
	);

	// if ( typeof activeAgent?.onToolResult === 'function' ) {
	// 	activeAgent.onToolResult(
	// 		tool_call.function.name,
	// 		toolResult,
	// 		callbacks,
	// 		context
	// 	);
	// }

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
		registerDefaultToolkits,
	};
}
