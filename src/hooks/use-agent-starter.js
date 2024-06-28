import { useEffect } from 'react';
import useChat from '../components/chat-provider/use-chat';
import useCurrentAgent from './use-current-agent';

const useAgentStarter = () => {
	const { started, loading, running } = useChat();
	const { onStart } = useCurrentAgent();
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
