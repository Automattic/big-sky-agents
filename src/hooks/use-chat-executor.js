/* eslint-disable camelcase, no-console */
import { useEffect } from 'react';
import useChat from '../components/chat-provider/use-chat';
import useCurrentAgent from './use-current-agent';

const useChatExecutor = () => {
	const { runChat } = useChat();
	const { tools, instructions, additionalInstructions } = useCurrentAgent();

	useEffect( () => {
		runChat( tools, instructions, additionalInstructions );
	}, [ runChat, instructions, additionalInstructions, tools ] );
};

export default useChatExecutor;
