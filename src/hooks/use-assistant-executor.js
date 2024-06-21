/* eslint-disable camelcase, no-console */
import { useEffect, useState } from 'react';

const useAssistantExecutor = ( {
	agent,
	chat: {
		enabled,
		running,
		runAssistant,

		// threads
		threadId,
		createThread,

		// assistants
		assistantId,

		// createAssistant,
		setAssistantId,
	},
	toolkit: { values },
} ) => {
	const [ tools, setTools ] = useState( [] );
	const [ instructions, setInstructions ] = useState( '' );
	const [ additionalInstructions, setAdditionalInstructions ] =
		useState( '' );

	// if there's no threadId, create one
	useEffect( () => {
		if ( ! running && ! threadId ) {
			console.warn( 'creating thread' );
			createThread();
		}
	}, [ createThread, running, threadId ] );

	// TODO: provide some way to create assistants
	// useEffect( () => {
	// 	if ( threadId && ! running && agent && ! assistantId ) {
	// 		console.warn( 'creating assistant' );
	// 		createAssistant( {
	// 			instructions: agent.getInstructions().format( values ),
	// 			tools: agent.getTools( values ),
	// 		} );
	// 	}
	// }, [ createAssistant, assistantId, agent, values, running, threadId ] );

	useEffect( () => {
		if ( agent ) {
			/**
			 * Compute new state
			 */
			const newTools = agent.getTools( values );
			const newInstructions = agent.getInstructions().format( values );
			const newAdditionalInstructions = agent
				.getAdditionalInstructions()
				.format( values );

			const newAssistantId = agent.getAssistantId();

			if ( ! newAssistantId ) {
				throw new Error( 'Assistant ID is required' );
			}

			if ( newAssistantId && newAssistantId !== assistantId ) {
				setAssistantId( newAssistantId );
			}

			if ( newInstructions && newInstructions !== instructions ) {
				// console.warn( '🧠 System prompt', newSystemPrompt );
				setInstructions( newInstructions );
			}

			if ( newAdditionalInstructions !== additionalInstructions ) {
				// console.warn( '🧠 Next step prompt', newNextStepPrompt );
				setAdditionalInstructions( newAdditionalInstructions );
			}

			if ( JSON.stringify( newTools ) !== JSON.stringify( tools ) ) {
				// console.warn( '🧠 Tools', newTools );
				setTools( newTools );
			}
		}
	}, [
		agent,
		assistantId,
		additionalInstructions,
		setAssistantId,
		instructions,
		tools,
		values,
	] );

	useEffect( () => {
		if (
			! enabled || // disabled
			running || // thinking
			! instructions // at a minimum we need a system prompt
		) {
			// return;
		}
		// runAssistant( tools, instructions, additionalInstructions );
	}, [
		enabled,
		runAssistant,
		running,
		instructions,
		additionalInstructions,
		tools,
	] );
};

export default useAssistantExecutor;
