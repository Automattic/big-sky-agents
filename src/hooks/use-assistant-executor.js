/* eslint-disable camelcase, no-console */
import { useEffect, useState } from 'react';

const useAssistantExecutor = ( {
	agent,
	chat: {
		started,

		setStarted,
		enabled,
		running,
		pendingToolRequests,
		setToolCallResult,
		runAssistant,
		// threads
		threadId,
		createThread,

		// assistants
		assistantId,
		// createAssistant,
		setAssistantId,
	},
	toolkit: { values, callbacks },
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
			return;
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

	// useEffect( () => {
	// 	// process tool calls for any tools with callbacks
	// 	// note that tools without callbacks will be processed outside this loop,
	// 	// and will need responses before the ChatModel can run again
	// 	if ( ! running && pendingToolRequests.length > 0 ) {
	// 		pendingToolRequests.forEach( ( tool_call ) => {
	// 			if ( tool_call.inProgress ) {
	// 				return;
	// 			}

	// 			if ( tool_call.error ) {
	// 				// console.error( '⚙️ Tool call error', tool_call.error );
	// 				throw new Error( tool_call.error );
	// 			}

	// 			const callback = callbacks[ tool_call.function.name ];

	// 			if ( typeof callback === 'function' ) {
	// 				setToolCallResult(
	// 					tool_call.id,
	// 					callback( tool_call.function.arguments )
	// 				);
	// 			}
	// 		} );
	// 	}
	// }, [ callbacks, pendingToolRequests, running, setToolCallResult ] );

	/**
	 * Call agent.onStart() when we render.
	 */
	useEffect( () => {
		if ( agent && ! running && ! started ) {
			// console.warn( '🧠 Starting agent', agent, started );
			setStarted( true );
			agent.onStart();
		}
	}, [ agent, running, setStarted, started ] );
};

export default useAssistantExecutor;
