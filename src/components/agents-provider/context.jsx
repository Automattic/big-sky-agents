import { dispatch, register } from '@wordpress/data';
import { createContext, useMemo } from '@wordpress/element';
import { store as defaultAgentsStore } from '../../store/index.js';
import { createAgentsStore } from '../../store/agents.js';
import defaultAgents from '../../ai/agents/default-agents.js';
import uuidv4 from '../../utils/uuid.js';

// Register default agents in the store
defaultAgents.forEach( ( agent ) => {
	dispatch( defaultAgentsStore ).registerAgent( agent );
} );

export const Context = createContext( defaultAgentsStore );
const { Consumer, Provider } = Context;
export const AgentsConsumer = Consumer;

// Create a Map to store instances
const storeInstances = new Map();

function AgentsProvider( { children, ...options } ) {
	// Create a stable key for the current set of options
	const optionsKey = JSON.stringify( options );

	// Use useMemo to create or retrieve the store instance
	const store = useMemo( () => {
		if ( ! storeInstances.has( optionsKey ) ) {
			const newStore = createAgentsStore(
				`agents-${ uuidv4() }`,
				options
			);
			register( newStore );
			storeInstances.set( optionsKey, newStore );
		}
		return storeInstances.get( optionsKey );
	}, [ options, optionsKey ] );

	return <Provider value={ store }>{ children }</Provider>;
}

export default AgentsProvider;
