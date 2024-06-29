import { dispatch, register } from '@wordpress/data';
import { createContext } from '@wordpress/element';
import { store as defaultAgentsStore } from '../../store/index.js';
import { createAgentsStore } from '../../store/agents.js';
import defaultAgents from '../../ai/agents/default-agents.js';

// register default agents in the store
defaultAgents.forEach( ( agent ) => {
	console.warn( 'Registering agent', agent, defaultAgentsStore );
	dispatch( defaultAgentsStore ).registerAgent( agent );
} );

export const Context = createContext( defaultAgentsStore );
const { Consumer, Provider } = Context;
export const AgentsConsumer = Consumer;

function AgentsProvider( { children, agents, activeAgentId } ) {
	// create a store from teh default config
	const store = createAgentsStore( 'custom-agents-store', {
		agents,
		activeAgentId,
	} );
	register( store );
	return <Provider value={ store }>{ children }</Provider>;
}

export default AgentsProvider;
