import { useContext, useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { Context } from './context.jsx';

function useAgent( agent ) {
	const agentStore = useContext( Context );

	const { registerAgent, setActiveAgent } = useDispatch( agentStore );
	const { activeAgentId } = useSelect( ( select ) => {
		const store = select( agentStore );
		return {
			activeAgentId: store.getActiveAgentId(),
		};
	} );

	useEffect( () => {
		registerAgent( agent );

		// if there's no current agent, set it as the current agent
		if ( ! activeAgentId ) {
			setActiveAgent( agent.id );
		}
	}, [ activeAgentId, agent, registerAgent, setActiveAgent ] );
}

export default useAgent;
