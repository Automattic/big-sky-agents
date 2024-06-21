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

/**
 * This is an example of switching dynamically between agents based on the Current Agent. TODO: some kind of registration mechanism.
 */

const useCurrentAgent = ( { chat, toolkit } ) => {
	const [ tools, setTools ] = useState( [] );
	const [ instructions, setInstructions ] = useState( '' );
	const [ additionalInstructions, setAdditionalInstructions ] =
		useState( '' );

	const agent = useMemo( () => {
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
			const newTools = agent.getTools( toolkit.values );
			const newInstructions = agent
				.getInstructions()
				.format( toolkit.values );
			const newAdditionalInstructions = agent
				.getAdditionalInstructions()
				.format( toolkit.values );

			console.warn( 'generated values', {
				newTools,
				newInstructions,
				newAdditionalInstructions,
			} );

			const newAssistantId = agent.getAssistantId();

			if ( ! newAssistantId ) {
				throw new Error( 'Assistant ID is required' );
			}

			if ( newAssistantId && newAssistantId !== chat.assistantId ) {
				chat.setAssistantId( newAssistantId );
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
		additionalInstructions,
		instructions,
		tools,
		toolkit.values,
		chat,
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

	return {
		onStart,
		informUser,
		tools,
		instructions,
		additionalInstructions,
	};
};

export default useCurrentAgent;
