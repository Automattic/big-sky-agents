/* eslint-disable camelcase, no-console */
import { useEffect } from 'react';
import useChat from '../components/chat-provider/use-chat';

const useAssistantExecutor = () => {
	const {
		running,
		error,
		threadId,
		createThread,
		createThreadRun,
		threadRunId,
	} = useChat();
	useEffect( () => {
		if ( ! running && ! error && ! threadId ) {
			createThread();
		}
	}, [ createThread, running, error, threadId ] );

	useEffect( () => {
		if ( ! running && ! error && threadId && ! threadRunId ) {
			createThreadRun();
		}
	}, [ createThreadRun, running, error, threadId, threadRunId ] );
};

export default useAssistantExecutor;
