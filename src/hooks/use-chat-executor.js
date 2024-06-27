/* eslint-disable camelcase, no-console */
import { useEffect } from 'react';
import useChat from '../components/chat-provider/use-chat';

const useChatExecutor = ( {
	agent: { tools, instructions, additionalInstructions },
} ) => {
	const { runChat } = useChat();
	useEffect( () => {
		runChat( tools, instructions, additionalInstructions );
	}, [ runChat, instructions, additionalInstructions, tools ] );
};

export default useChatExecutor;
