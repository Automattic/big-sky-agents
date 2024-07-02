import { useCallback, useContext } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { Context } from './context.jsx';
import defaultAgents from '../../ai/agents/default-agents.js';

function useAgents() {
	const agentStore = useContext( Context );

	const { registerAgent, setActiveAgent, setGoal, setThought } =
		useDispatch( agentStore );
	const { agents, activeAgentId, activeAgent, goal, thought } = useSelect(
		( select ) => {
			// dump available keys of select(agentstore)
			const store = select( agentStore );
			console.warn( 'selectors', Object.keys( store ) );
			return {
				agents: store.getAgents(),
				activeAgent: store.getActiveAgent(),
				activeAgentId: store.getActiveAgentId(),
				goal: store.getAgentGoal(),
				thought: store.getAgentThought(),
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
		goal,
		thought,
		activeAgent,
		activeAgentId,
		setGoal,
		setThought,
		setActiveAgent,
		registerAgent,
		registerDefaultAgents,
	};
}

export default useAgents;
