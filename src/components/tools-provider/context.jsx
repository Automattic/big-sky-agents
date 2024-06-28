/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { initialState } from './tools-reducer';
import defaultTools from '../../ai/tools/default-tools';

const configToState = ( config ) => {
	return {
		tools: config.tools ?? [],
	};
};

export const Context = createContext( {
	...initialState,
	tools: defaultTools,
} );

function ToolsProvider( { children, ...config } ) {
	return (
		<Context.Provider
			value={ config ? configToState( config ) : initialState }
		>
			{ children }
		</Context.Provider>
	);
}

export const ToolsConsumer = Context.Consumer;
export default ToolsProvider;
