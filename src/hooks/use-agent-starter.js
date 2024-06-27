import { useEffect } from 'react';
import useChat from '../components/chat-provider/use-chat';

const useAgentStarter = ( { agent: { onStart } } ) => {
	const { started, loading, running } = useChat();
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
