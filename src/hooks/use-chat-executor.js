/* eslint-disable camelcase, no-console */
import { useEffect } from 'react';

const useChatExecutor = ( {
	agent: { tools, instructions, additionalInstructions },
	chat: { enabled, loading, running, runChat },
} ) => {
	useEffect( () => {
		if (
			! enabled || // disabled
			running || // thinking
			loading || // loading
			! instructions // at a minimum we need a system prompt
		) {
			return;
		}
		runChat( tools, instructions, additionalInstructions );
	}, [
		enabled,
		runChat,
		loading,
		running,
		instructions,
		additionalInstructions,
		tools,
	] );
};

export default useChatExecutor;
