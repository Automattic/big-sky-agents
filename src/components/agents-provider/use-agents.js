/**
 * WordPress dependencies
 */
import {
	useCallback,
	useContext,
	useMemo,
	useReducer,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Context } from './context.jsx';
import { agentsReducer } from './agents-reducer';
import defaultAgents from '../../ai/agents/default-agents';

export default function useAgents() {
	const config = useContext( Context );
	const [ state, dispatch ] = useReducer( agentsReducer, config );

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

	console.log( 're-render useAgents', state );

	return {
		agents: state.agents,
		activeAgent: state.agents.find(
			( agent ) => agent.id === state.activeAgentId
		),
		activeAgentId: state.activeAgentId,
		setActiveAgent,
		registerAgent,
		registerDefaultAgents,
	};
}
