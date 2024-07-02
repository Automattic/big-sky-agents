import { dispatch, register } from '@wordpress/data';
import { createContext } from '@wordpress/element';
import { store as defaultToolkitsStore } from '../../store/index.js';
import { createToolkitsStore } from '../../store/toolkits.js';
import defaultToolkits from '../../ai/toolkits/default-toolkits';
import uuidv4 from '../../utils/uuid.js';

defaultToolkits.forEach( ( toolkit ) => {
	dispatch( defaultToolkitsStore ).registerToolkit( toolkit );
} );

export const Context = createContext( defaultToolkitsStore );
const { Consumer, Provider } = Context;
export const ToolkitsConsumer = Consumer;

function ToolkitsProvider( { children, ...options } ) {
	const store = createToolkitsStore( `toolkits-${ uuidv4() }`, options );
	register( store );
	console.warn( 'toolkits store', store.name );
	return <Provider value={ store }>{ children }</Provider>;
}
export default ToolkitsProvider;
