import { useEffect } from 'react';

const useAgentStarter = ( { agent, chat: { started, loading, running } } ) => {
	/**
	 * Call agent.onStart() when we render.
	 */
	useEffect( () => {
		console.warn( 'useAgentStarter', { agent, running, started, loading } );
		if ( agent && ! running && ! loading && ! started ) {
			agent.onStart();
		}
	}, [ agent, running, started, loading ] );
};

export default useAgentStarter;
