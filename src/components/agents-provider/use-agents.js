import { useContext } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { Context } from './context.jsx';

function useAgents() {
	const agentStore = useContext( Context );

	const { registerAgent, setActiveAgent } = useDispatch( agentStore );
	const { agents, activeAgentId, activeAgent } = useSelect( ( select ) => {
		return {
			agents: select( agentStore ).getAgents(),
			activeAgent: select( agentStore ).getActiveAgent(),
			activeAgentId: select( agentStore ).getActiveAgentId(),
		};
	} );

	return {
		agents,
		activeAgent,
		activeAgentId,
		setActiveAgent,
		registerAgent,
	};
}

export default useAgents;
