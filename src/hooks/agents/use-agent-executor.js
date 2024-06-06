/* eslint-disable camelcase, no-console */
import { useEffect, useState } from 'react';

const useAgentExecutor = ( {
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
	const [ systemPrompt, setSystemPrompt ] = useState( '' );
	const [ nextStepPrompt, setNextStepPrompt ] = useState( '' );

	useEffect( () => {
		if ( agent ) {
			/**
			 * Compute new state
			 */
			const newTools = agent.getTools( values );
			const newSystemPrompt = agent.getSystemPrompt().format( values );
			const newNextStepPrompt = agent
				.getNextStepPrompt()
				.format( values );

			if ( newSystemPrompt && newSystemPrompt !== systemPrompt ) {
				// console.warn( '🧠 System prompt', newSystemPrompt );
				setSystemPrompt( newSystemPrompt );
			}

			if ( newNextStepPrompt !== nextStepPrompt ) {
				// console.warn( '🧠 Next step prompt', newNextStepPrompt );
				setNextStepPrompt( newNextStepPrompt );
			}

			if ( JSON.stringify( newTools ) !== JSON.stringify( tools ) ) {
				// console.warn( '🧠 Tools', newTools );
				setTools( newTools );
			}
		}
	}, [ agent, nextStepPrompt, systemPrompt, tools, values ] );

	useEffect( () => {
		if (
			! enabled || // disabled
			running || // thinking
			! systemPrompt || // at a minimum we need a system prompt
			history.length === 0 // no history
		) {
			return;
		}
		runAgent( history, tools, systemPrompt, nextStepPrompt );
	}, [
		enabled,
		runAgent,
		running,
		systemPrompt,
		nextStepPrompt,
		tools,
		history,
	] );

	useEffect( () => {
		// process tool calls for any tools with callbacks
		// note that tools without callbacks will be processed outside this loop,
		// and will need responses before the LLM can run again
		if ( ! running && pendingToolRequests.length > 0 ) {
			pendingToolRequests.forEach( ( tool_call ) => {
				if ( tool_call.inProgress ) {
					return;
				}

				if ( tool_call.error ) {
					console.error( '⚙️ Tool call error', tool_call.error );
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
			console.warn( '🧠 Starting agent', agent, started );
			setStarted( true );
			agent.onStart();
		}
	}, [ agent, running, setStarted, started ] );
};

export default useAgentExecutor;
