/* eslint-disable camelcase, no-console */
import { useEffect, useState } from 'react';

const useChatExecutor = ( {
	agent,
	chat: {
		started,
		setStarted,
		enabled,
		running,
		history,
		pendingToolRequests,
		setToolCallResult,
		runAgent,
	},
	toolkit: { values, callbacks },
} ) => {
	const [ tools, setTools ] = useState( [] );
	const [ instructions, setInstructions ] = useState( '' );
	const [ additionalInstructions, setAdditionalInstructions ] =
		useState( '' );

	useEffect( () => {
		if ( agent ) {
			/**
			 * Compute new state
			 */
			const newTools = agent.getTools( values );
			const newSystemPrompt = agent.getInstructions().format( values );
			const newNextStepPrompt = agent
				.getAdditionalInstructions()
				.format( values );

			if ( newSystemPrompt && newSystemPrompt !== instructions ) {
				// console.warn( '🧠 System prompt', newSystemPrompt );
				setInstructions( newSystemPrompt );
			}

			if ( newNextStepPrompt !== additionalInstructions ) {
				// console.warn( '🧠 Next step prompt', newNextStepPrompt );
				setAdditionalInstructions( newNextStepPrompt );
			}

			if ( JSON.stringify( newTools ) !== JSON.stringify( tools ) ) {
				// console.warn( '🧠 Tools', newTools );
				setTools( newTools );
			}
		}
	}, [ agent, additionalInstructions, instructions, tools, values ] );

	useEffect( () => {
		if (
			! enabled || // disabled
			running || // thinking
			! instructions || // at a minimum we need a system prompt
			history.length === 0 // no history
		) {
			return;
		}
		runAgent( history, tools, instructions, additionalInstructions );
	}, [
		enabled,
		runAgent,
		running,
		instructions,
		additionalInstructions,
		tools,
		history,
	] );

	useEffect( () => {
		// process tool calls for any tools with callbacks
		// note that tools without callbacks will be processed outside this loop,
		// and will need responses before the ChatModel can run again
		if ( ! running && pendingToolRequests.length > 0 ) {
			pendingToolRequests.forEach( ( tool_call ) => {
				if ( tool_call.inProgress ) {
					return;
				}

				if ( tool_call.error ) {
					// console.error( '⚙️ Tool call error', tool_call.error );
					throw new Error( tool_call.error );
				}

				const callback = callbacks[ tool_call.function.name ];

				if ( typeof callback === 'function' ) {
					setToolCallResult(
						tool_call.id,
						callback( tool_call.function.arguments )
					);
				}
			} );
		}
	}, [ callbacks, pendingToolRequests, running, setToolCallResult ] );

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

export default useChatExecutor;
