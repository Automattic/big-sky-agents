import { dispatch, register } from '@wordpress/data';
import { createContext } from '@wordpress/element';
import { store as defaultAgentsStore } from '../../store/index.js';
import { createAgentsStore } from '../../store/agents.js';
import defaultAgents from '../../ai/agents/default-agents.js';
import uuidv4 from '../../utils/uuid.js';

// register default agents in the store
defaultAgents.forEach( ( agent ) => {
	dispatch( defaultAgentsStore ).registerAgent( agent );
} );

export const Context = createContext( defaultAgentsStore );
const { Consumer, Provider } = Context;
export const AgentsConsumer = Consumer;

function AgentsProvider( { children, ...options } ) {
	// create a hash of the options to use as a unique store name
	const store = createAgentsStore( `agents-${ uuidv4() }`, options );
	register( store );

	return <Provider value={ store }>{ children }</Provider>;
}

export default AgentsProvider;
