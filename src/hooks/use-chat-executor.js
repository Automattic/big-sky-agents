/* eslint-disable camelcase, no-console */
import { useEffect, useState } from 'react';

const useChatExecutor = ( {
	agent,
	chat: { enabled, running, history, runAgent },
	toolkit: { values },
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
};

export default useChatExecutor;
