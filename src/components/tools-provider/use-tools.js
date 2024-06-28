/**
 * WordPress dependencies
 */
import {
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useReducer,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { toolsReducer } from './tools-reducer';
import defaultTools from '../../ai/tools/default-tools';
// import useChat from '../chat-provider/use-chat';

/**
 * Internal dependencies
 */
import { Context } from './context.jsx';

export default function useTools() {
	const config = useContext( Context );

	const [ state, dispatch ] = useReducer( toolsReducer, config );

	const registerTool = useCallback( ( tool ) => {
		dispatch( { type: 'REGISTER_TOOL', payload: { tool } } );
	}, [] );

	const registerDefaultTools = useCallback( () => {
		defaultTools.forEach( ( tool ) => {
			registerTool( tool );
		} );
	}, [ registerTool ] );

	// used to actually call the tool, e.g. callbacks.getWeather( { location: "Boston, MA" } )
	const callbacks = useMemo( () => {
		return state.tools.reduce( ( acc, tool ) => {
			acc[ tool.name ] = tool.callback;
			return acc;
		}, {} );
	}, [ state.tools ] );

	return {
		tools: state.tools,
		callbacks,
		registerTool,
		registerDefaultTools,
	};
}
