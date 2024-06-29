import { register } from '@wordpress/data';
import { createContext } from '@wordpress/element';
import { store as defaultToolsStore } from '../../store/index.js';
import { createToolsStore } from '../../store/tools.js';

export const Context = createContext( defaultToolsStore );
const { Consumer, Provider } = Context;
export const ToolsConsumer = Consumer;

function ToolsProvider( { children, tools } ) {
	// create a store from teh default config
	const store = createToolsStore( 'custom-tools-store', { tools } );
	register( store );
	return <Provider value={ store }>{ children }</Provider>;
}
export default ToolsProvider;
