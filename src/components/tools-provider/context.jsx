import { dispatch, register } from '@wordpress/data';
import { createContext } from '@wordpress/element';
import { store as defaultToolsStore } from '../../store/index.js';
import { createToolsStore } from '../../store/tools.js';
import defaultTools from '../../ai/tools/default-tools';
import uuidv4 from '../../utils/uuid.js';

defaultTools.forEach( ( agent ) => {
	dispatch( defaultToolsStore ).registerAgent( agent );
} );

export const Context = createContext( defaultToolsStore );
const { Consumer, Provider } = Context;
export const ToolsConsumer = Consumer;

function ToolsProvider( { children, ...options } ) {
	const store = createToolsStore( `tools-${ uuidv4() }`, options );
	register( store );
	return <Provider value={ store }>{ children }</Provider>;
}
export default ToolsProvider;
