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
import { agentsReducer, initialState } from './agents-reducer';
import defaultAgents from '../../ai/agents/default-agents';

export const Context = createContext();

function AgentsProvider( { children, config } ) {
	const [ state, dispatch ] = useReducer(
		agentsReducer,
		config ?? initialState
	);

	const registerAgent = useCallback( ( agent ) => {
		dispatch( { type: 'REGISTER_AGENT', payload: { agent } } );
	}, [] );

	const registerDefaultAgents = useCallback( () => {
		defaultAgents.forEach( ( agent ) => {
			registerAgent( agent );
		} );
	}, [ registerAgent ] );

	const setActiveAgent = useCallback( ( agentId ) => {
		dispatch( { type: 'SET_ACTIVE_AGENT', payload: { agentId } } );
	}, [] );

	const activeAgent = useMemo(
		() =>
			state.agents.find( ( agent ) => agent.id === state.activeAgentId ),
		[ state.activeAgentId, state.agents ]
	);

	return (
		<Context.Provider
			value={ {
				agents: state.agents,
				activeAgent,
				setActiveAgent,
				registerAgent,
				registerDefaultAgents,
			} }
		>
			{ children }
		</Context.Provider>
	);
}

export const AgentsConsumer = Context.Consumer;
export default AgentsProvider;
