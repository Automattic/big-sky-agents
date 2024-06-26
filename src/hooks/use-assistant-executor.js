/* eslint-disable camelcase, no-console */
import { useEffect } from 'react';

const useAssistantExecutor = ( {
	agent: { tools, instructions, additionalInstructions },
	chat: {
		loading,
		enabled,
		running,
		runAssistant,

		// threads
		threadId,
		createThread,
		threadRunId,
		createThreadRun,
	},
} ) => {
	// if there's no threadId, create one
	useEffect( () => {
		if ( ! running && ! threadId ) {
			createThread();
		}
	}, [ createThread, running, threadId ] );

	// TODO: provide some way to create assistants
	// useEffect( () => {
	// 	if ( threadId && ! running && agent && ! assistantId ) {
	// 		console.warn( 'creating assistant' );
	// 		createAssistant( {
	// 			instructions: agent.getInstructions(),
	// 			tools: agent.getTools(),
	// 		} );
	// 	}
	// }, [ createAssistant, assistantId, agent, values, running, threadId ] );

	useEffect( () => {
		if (
			! enabled || // disabled
			loading || // not loaded
			running || // thinking
			! threadId || // no thread
			! threadRunId?.status === 'completed' || // already running
			! instructions // at a minimum we need a system prompt
		) {
			// console.warn( 'not running assistant in executuor', {
			// 	loading,
			// 	enabled,
			// 	running,
			// 	threadId,
			// 	threadRunId,
			// 	instructions,
			// } );
			return;
		}
		createThreadRun( tools, instructions, additionalInstructions );
	}, [
		enabled,
		runAssistant,
		running,
		instructions,
		additionalInstructions,
		tools,
		createThreadRun,
		threadId,
		loading,
		threadRunId,
	] );
};

export default useAssistantExecutor;
