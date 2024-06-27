import { useCallback, useEffect, useMemo, useState } from 'react';
// import { useEffect,  } from 'react';
/**
 * Internal dependencies
 */
import WapuuAgent from '../agents/wapuu-agent.js';
import TutorAgent from '../agents/tutor-agent.js';
import DesignAgent from '../agents/design-agent.js';
import SiteSpecAgent from '../agents/site-spec-agent.js';
import PageSpecAgent from '../agents/page-spec-agent.js';
import WooAgent from '../agents/woo-agent.js';
import StatsAgent from '../agents/stats-agent.js';
import {
	JETPACK_STATS_AGENT_ID,
	WAPUU_AGENT_ID,
	WOO_STORE_AGENT_ID,
	WORDPRESS_DESIGN_AGENT_ID,
	WORDPRESS_PAGE_SPEC_AGENT_ID,
	WORDPRESS_SITE_SPEC_AGENT_ID,
	WORDPRESS_TUTOR_AGENT_ID,
} from '../agents/default-agents.js';
import useChat from '../components/chat-provider/use-chat.js';

/**
 * This is an example of switching dynamically between agents based on the Current Agent. TODO: some kind of registration mechanism.
 */

const useCurrentAgent = ( { toolkit } ) => {
	const chat = useChat();
	const [ tools, setTools ] = useState( [] );
	const [ instructions, setInstructions ] = useState( '' );
	const [ additionalInstructions, setAdditionalInstructions ] =
		useState( '' );

	const { assistantId, setAssistantId } = chat;

	const agent = useMemo( () => {
		// const newAgent = agentRegistry.getAgent( toolkit.values.agent.id );
		switch ( toolkit.values.agent.id ) {
			case WAPUU_AGENT_ID:
				return new WapuuAgent( chat, toolkit );
			case WORDPRESS_TUTOR_AGENT_ID:
				return new TutorAgent( chat, toolkit );
			case WORDPRESS_DESIGN_AGENT_ID:
				return new DesignAgent( chat, toolkit );
			case WORDPRESS_SITE_SPEC_AGENT_ID:
				return new SiteSpecAgent( chat, toolkit );
			case WORDPRESS_PAGE_SPEC_AGENT_ID:
				return new PageSpecAgent( chat, toolkit );
			case WOO_STORE_AGENT_ID:
				return new WooAgent( chat, toolkit );
			case JETPACK_STATS_AGENT_ID:
				return new StatsAgent( chat, toolkit );
			default:
				return new WapuuAgent( chat, toolkit );
		}
	}, [ chat, toolkit ] );

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

export default useCurrentAgent;
