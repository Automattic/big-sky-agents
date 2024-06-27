/* eslint-disable camelcase, no-console */
import { useEffect } from 'react';
import useChat from '../components/chat-provider/use-chat';

const useAssistantExecutor = ( {
	agent: { tools, instructions, additionalInstructions },
} ) => {
	const {
		running,
		history,
		isThreadRunComplete,
		isAwaitingUserInput,
		additionalMessages,

		// threads
		threadId,
		createThread,
		createThreadRun,
	} = useChat();
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
			! running &&
			! isAwaitingUserInput &&
			isThreadRunComplete &&
			additionalMessages.length === 0 &&
			history.length > 0
		) {
			createThreadRun( tools, instructions, additionalInstructions );
		}
	}, [
		additionalInstructions,
		additionalMessages.length,
		createThreadRun,
		history.length,
		instructions,
		isAwaitingUserInput,
		isThreadRunComplete,
		running,
		tools,
	] );
};

export default useAssistantExecutor;
