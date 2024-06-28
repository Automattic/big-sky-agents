/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { initialState } from './agents-reducer';
import defaultAgents from '../../ai/agents/default-agents';

export const Context = createContext( {
	...initialState,
	agents: defaultAgents,
} );

const configToState = ( config ) => {
	return {
		activeAgentId: config.activeAgentId ?? null,
		agents: config.agents ?? [],
	};
};

function AgentsProvider( { children, ...config } ) {
	return (
		<Context.Provider
			value={ config ? configToState( config ) : initialState }
		>
			{ children }
		</Context.Provider>
	);
}

export const AgentsConsumer = Context.Consumer;
export default AgentsProvider;
