import { useCallback, useEffect, useMemo, useState } from 'react';
/**
 * Internal dependencies
 */
import {
	JETPACK_STATS_AGENT_ID,
	WAPUU_AGENT_ID,
	WOO_STORE_AGENT_ID,
	WORDPRESS_DESIGN_AGENT_ID,
	WORDPRESS_PAGE_SPEC_AGENT_ID,
	WORDPRESS_SITE_SPEC_AGENT_ID,
	WORDPRESS_TUTOR_AGENT_ID,
} from '../ai/agents/default-agents.js';
import useChat from '../components/chat-provider/use-chat.js';

/**
 * This is an example of switching dynamically between agents based on the Current Agent. TODO: some kind of registration mechanism.
 */

const useAgent = ( { agentId, toolkit } ) => {
	const chat = useChat();

	const [ tools, setTools ] = useState( [] );
	const [ instructions, setInstructions ] = useState( '' );
	const [ additionalInstructions, setAdditionalInstructions ] =
		useState( '' );

	const { assistantId, setAssistantId } = chat;

	const agent = useMemo( () => {
		const agentClass =
	}, [ agentId, chat, toolkit ] );

	useEffect( () => {
		if ( agent ) {
			/**
			 * Compute new state
			 */
			const newTools = agent.getTools();
			const newInstructions = agent.getInstructions();
			const newAdditionalInstructions = agent.getAdditionalInstructions();

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
		additionalInstructions,
		agent,
		assistantId,
		setAssistantId,
		instructions,
		tools,
	] );

	const onStart = useCallback( () => {
		if ( agent ) {
			agent.onStart();
		}
	}, [ agent ] );

	const informUser = useCallback(
		( message ) => {
			if ( agent ) {
				agent.informUser( message );
			}
		},
		[ agent ]
	);

	const onConfirm = useCallback(
		( confirmed ) => {
			if ( agent && agent.onConfirm ) {
				agent.onConfirm( confirmed );
			} else {
				console.warn( 'No onConfirm method found for agent' );
			}
		},
		[ agent ]
	);

	return {
		onStart,
		onConfirm,
		informUser,
		tools,
		instructions,
		additionalInstructions,
	};
};

export default useAgent;
