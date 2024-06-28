/**
 * WordPress dependencies
 */
import {
	createContext,
	useCallback,
	useMemo,
	useReducer,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { initialState, toolsReducer } from './tools-reducer';
import defaultTools from '../../ai/tools/default-tools';
import useChat from '../chat-provider/use-chat';

export const Context = createContext();

function ToolsProvider( { children, tools } ) {
	const { call } = useChat();

	const [ state, dispatch ] = useReducer(
		toolsReducer,
		tools ? { ...initialState, tools } : initialState
	);

	const registerTool = useCallback( ( tool ) => {
		dispatch( { type: 'REGISTER_TOOL', payload: { tool } } );
	}, [] );

	const registerDefaultTools = useCallback( () => {
		defaultTools.forEach( ( tool ) => {
			registerTool( tool );
		} );
	}, [ registerTool ] );

	// used to pretend the agent invoked something, e.g. invoke.askUser( { question: "What would you like to do next?" } )
	const invoke = useMemo( () => {
		return state.tools.reduce( ( acc, tool ) => {
			acc[ tool.name ] = ( args, id ) => call( tool.name, args, id );
			return acc;
		}, {} );
	}, [ call, state.tools ] );

	// used to actually call the tool, e.g. callbacks.getWeather( { location: "Boston, MA" } )
	const callbacks = useMemo( () => {
		return state.tools.reduce( ( acc, tool ) => {
			acc[ tool.name ] = tool.callback;
			return acc;
		}, {} );
	}, [ state.tools ] );

	return (
		<Context.Provider
			value={ {
				tools: state.tools,
				invoke,
				callbacks,
				registerTool,
				registerDefaultTools,
			} }
		>
			{ children }
		</Context.Provider>
	);
}

export const ToolsConsumer = Context.Consumer;
export default ToolsProvider;
