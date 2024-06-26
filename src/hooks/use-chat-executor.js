/* eslint-disable camelcase, no-console */
import { useEffect } from 'react';

const useChatExecutor = ( {
	agent: { tools, instructions, additionalInstructions },
	chat: { runChat },
} ) => {
	useEffect( () => {
		runChat( tools, instructions, additionalInstructions );
	}, [ runChat, instructions, additionalInstructions, tools ] );
};

export default useChatExecutor;
