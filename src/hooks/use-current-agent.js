import { useCallback, useEffect, useState } from 'react';
// import { useEffect,  } from 'react';
/**
 * Internal dependencies
 */

import useChat from '../components/chat-provider/use-chat.js';
import useAgents from '../components/agents-provider/use-agents.js';
import useTools from '../components/tools-provider/use-tools.js';
import useReduxAgentToolkit from './use-redux-agent-toolkit.js';

/**
 * This is an example of switching dynamically between agents based on the Current Agent. TODO: some kind of registration mechanism.
 */

const toOpenAITool = ( tool ) => ( {
	type: 'function',
	function: {
		name: tool.name,
		description: tool.description,
		parameters: tool.parameters,
	},
} );

const useCurrentAgent = () => {
	const chat = useChat();
	const toolkit = useReduxAgentToolkit();
	const { activeAgent } = useAgents();
	const { tools: allTools, invoke } = useTools();
	const [ tools, setTools ] = useState( [] );
	const [ instructions, setInstructions ] = useState( '' );
	const [ additionalInstructions, setAdditionalInstructions ] =
		useState( '' );
	const { assistantId, setAssistantId } = chat;

	console.warn( 'all tools', allTools );

	useEffect( () => {
		if ( activeAgent ) {
			/**
			 * Compute new state
			 */

			let newTools =
				typeof activeAgent.tools === 'function'
					? activeAgent.tools( toolkit.context )
					: activeAgent.tools;

			if ( ! newTools ) {
				// use all tools
				newTools = allTools;
			}

			const newInstructions =
				typeof activeAgent.instructions === 'function'
					? activeAgent.instructions( toolkit.context )
					: activeAgent.instructions;

			const newAdditionalInstructions =
				typeof activeAgent.additionalInstructions === 'function'
					? activeAgent.additionalInstructions( toolkit.context )
					: activeAgent.additionalInstructions;

			if ( activeAgent.assistantId !== assistantId ) {
				setAssistantId( activeAgent.assistantId );
			}

			if ( newInstructions && newInstructions !== instructions ) {
				console.warn( '🧠 System prompt', newInstructions );
				setInstructions( newInstructions );
			}

			if ( newAdditionalInstructions !== additionalInstructions ) {
				console.warn(
					'🧠 Next step prompt',
					newAdditionalInstructions
				);
				setAdditionalInstructions( newAdditionalInstructions );
			}

			if ( JSON.stringify( newTools ) !== JSON.stringify( tools ) ) {
				console.warn( '🧠 Tools', newTools );
				setTools( newTools.map( toOpenAITool ) );
			}
		}
	}, [
		additionalInstructions,
		activeAgent,
		assistantId,
		setAssistantId,
		instructions,
		tools,
		toolkit.context,
		allTools,
	] );

	const onStart = useCallback( () => {
		if ( activeAgent ) {
			console.warn( 'starting', invoke, activeAgent );
			activeAgent.onStart( invoke );
		}
	}, [ activeAgent, invoke ] );

	const onConfirm = useCallback(
		( confirmed ) => {
			if ( activeAgent && activeAgent.onConfirm ) {
				activeAgent.onConfirm( confirmed );
			} else {
				console.warn( 'No onConfirm method found for activeAgent' );
			}
		},
		[ activeAgent ]
	);

	return {
		onStart,
		onConfirm,
		tools,
		instructions,
		additionalInstructions,
	};
};

export default useCurrentAgent;
