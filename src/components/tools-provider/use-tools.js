/**
 * WordPress dependencies
 */
import { useCallback, useContext, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import defaultTools from '../../ai/tools/default-tools';

/**
 * Internal dependencies
 */
import { Context } from './context.jsx';
import { useDispatch, useSelect } from '@wordpress/data';

export default function useTools() {
	const toolStore = useContext( Context );
	const { registerTool } = useDispatch( toolStore );
	const tools = useSelect( ( select ) => select( toolStore ).getTools() );

	const registerDefaultTools = useCallback( () => {
		defaultTools.forEach( ( tool ) => {
			registerTool( tool );
		} );
	}, [ registerTool ] );

	// used to actually call the tool, e.g. callbacks.getWeather( { location: "Boston, MA" } )
	const callbacks = useMemo( () => {
		return tools?.reduce( ( acc, tool ) => {
			acc[ tool.name ] = tool.callback;
			return acc;
		}, {} );
	}, [ tools ] );

	return {
		tools,
		callbacks,
		registerTool,
		registerDefaultTools,
	};
}
