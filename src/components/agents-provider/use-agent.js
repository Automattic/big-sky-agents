import { useContext, useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { Context } from './context.jsx';

function useAgent( agent ) {
	const agentStore = useContext( Context );
	const toolkitsStore = useContext( Context );

	const { registerAgent, setActiveAgent } = useDispatch( agentStore );
	const { registerToolkit } = useDispatch( toolkitsStore );
	const { activeAgentId } = useSelect( ( select ) => {
		const store = select( agentStore );
		return {
			activeAgentId: store.getActiveAgentId(),
		};
	} );

	useEffect( () => {
		registerAgent( agent );

		for ( const toolkit of agent.toolkits || [] ) {
			registerToolkit( toolkit );
		}

		// if there's no current agent, set it as the current agent
		if ( ! activeAgentId ) {
			setActiveAgent( agent.id );
		}
	}, [
		activeAgentId,
		agent,
		registerAgent,
		registerToolkit,
		setActiveAgent,
	] );
}

export default useAgent;
