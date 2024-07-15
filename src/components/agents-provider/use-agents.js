import { useCallback, useContext } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { Context } from './context.jsx';
import defaultAgents from '../../ai/agents/default-agents.js';

function useAgents() {
	const agentStore = useContext( Context );

	const { registerAgent, setActiveAgent, setAgentStarted } =
		useDispatch( agentStore );
	const { agents, activeAgentId, activeAgent, name, started } = useSelect(
		( select ) => {
			const store = select( agentStore );
			return {
				name: store.getActiveAgentName(),
				agents: store.getAgents(),
				activeAgent: store.getActiveAgent(),
				activeAgentId: store.getActiveAgentId(),
				started: store.isAgentStarted(),
			};
		}
	);

	const registerDefaultAgents = useCallback( () => {
		defaultAgents.forEach( ( agent ) => {
			registerAgent( agent );
		} );
	}, [ registerAgent ] );

	return {
		agents,
		name,
		started,
		activeAgent,
		activeAgentId,
		setAgentStarted,
		setActiveAgent,
		registerAgent,
		registerDefaultAgents,
	};
}

export default useAgents;
