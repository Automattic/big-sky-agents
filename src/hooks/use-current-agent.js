import { useMemo } from 'react';

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

const useCurrentAgent = ( { chat, toolkit } ) => {
	return useMemo( () => {
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
};

export default useCurrentAgent;
