/* eslint-disable camelcase, no-console */
import { useEffect } from 'react';
import useChat from '../components/chat-provider/use-chat';

const useChatExecutor = () => {
	const { running, error, runChat } = useChat();

	useEffect( () => {
		if ( ! running && ! error ) {
			runChat();
		}
	}, [ running, error, runChat ] );
};

export default useChatExecutor;
