import { useEffect } from 'react';

const useAgentStarter = ( {
	agent: { onStart },
	chat: { started, loading, running },
} ) => {
	/**
	 * Call agent.onStart() when we render.
	 */
	useEffect( () => {
		if ( onStart && ! running && ! loading && ! started ) {
			onStart();
		}
	}, [ running, started, loading, onStart ] );
};

export default useAgentStarter;
