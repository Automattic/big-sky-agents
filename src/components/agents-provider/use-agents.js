import { useCallback, useContext } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { Context } from './context.jsx';
import defaultAgents from '../../ai/agents/default-agents.js';

function useAgents() {
	const agentStore = useContext( Context );

	const {
		registerAgent,
		setActiveAgent,
		setAgentGoal,
		setAgentThought,
		setAgentStarted,
	} = useDispatch( agentStore );
	const { agents, activeAgentId, activeAgent, name, goal, thought, started } =
		useSelect( ( select ) => {
			const store = select( agentStore );
			return {
				name: store.getActiveAgentName(),
				agents: store.getAgents(),
				activeAgent: store.getActiveAgent(),
				activeAgentId: store.getActiveAgentId(),
				goal: store.getAgentGoal(),
				thought: store.getAgentThought(),
				started: store.isAgentStarted(),
			};
		} );

	const registerDefaultAgents = useCallback( () => {
		defaultAgents.forEach( ( agent ) => {
			registerAgent( agent );
		} );
	}, [ registerAgent ] );

	return {
		agents,
		name,
		goal,
		thought,
		started,
		activeAgent,
		activeAgentId,
		setAgentStarted,
		setAgentGoal,
		setAgentThought,
		setActiveAgent,
		registerAgent,
		registerDefaultAgents,
	};
}

export default useAgents;
