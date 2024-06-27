import WapuuAgent from './wapuu-agent.js';
import TutorAgent from './tutor-agent.js';
import DesignAgent from './design-agent.js';
import SiteSpecAgent from './site-spec-agent.js';
import PageSpecAgent from './page-spec-agent.js';
import WooAgent from './woo-agent.js';
import StatsAgent from './stats-agent.js';

import SiteSpecToolkit from '../toolkits/site-spec.js';

export const WAPUU_AGENT_ID = 'Wapuu';
export const WAPUU_ASSISTANT_ID = 'asst_lk7tPSgLWShOx6N0LJuxQGVe';
export const WORDPRESS_SITE_SPEC_AGENT_ID = 'WPSiteSpec';
export const WORDPRESS_PAGE_SPEC_AGENT_ID = 'WPPageSpec';
export const WORDPRESS_DESIGN_AGENT_ID = 'WPDesign';
export const WORDPRESS_TUTOR_AGENT_ID = 'WPTutor';
export const JETPACK_STATS_AGENT_ID = 'JetpackStats';
export const WOO_STORE_AGENT_ID = 'WooStore';

export default [
	{
		id: WAPUU_AGENT_ID,
		// OpenAI assistant_id
		assistantId: WAPUU_ASSISTANT_ID,
		name: 'Wapuu',
		description:
			'Here to understand your goal and choose the best agent to help you.',
		agent: WapuuAgent,
	},
	{
		id: WORDPRESS_SITE_SPEC_AGENT_ID,
		assistantId: WAPUU_ASSISTANT_ID,
		name: 'Site Settings and Pages Assistant',
		description:
			'Set site title, description, type, topic, location and pages.',
		agent: SiteSpecAgent,
		toolkit: SiteSpecToolkit,
	},
	{
		id: WORDPRESS_PAGE_SPEC_AGENT_ID,
		assistantId: WAPUU_ASSISTANT_ID,
		name: 'Page Content Assistant',
		description:
			'Add and edit pages, set page title, description, category, and sections.',
		agent: PageSpecAgent,
	},
	{
		id: WORDPRESS_DESIGN_AGENT_ID,
		assistantId: WAPUU_ASSISTANT_ID,
		name: 'Design Assistant',
		description:
			'Helps you design your site, set fonts and colors, etc. Can also analyze any URL to extract style and layout information.',
		agent: DesignAgent,
	},
	{
		id: WORDPRESS_TUTOR_AGENT_ID,
		assistantId: WAPUU_ASSISTANT_ID,
		name: 'WordPress Tutor',
		description:
			'Helps you learn about WordPress, joining the community, and more',
		agent: TutorAgent,
	},
	{
		id: JETPACK_STATS_AGENT_ID,
		assistantId: WAPUU_ASSISTANT_ID,
		name: 'Site Stats Assistant',
		description: "Helps you understand your site's traffic and SEO",
		agent: StatsAgent,
	},
	{
		id: WOO_STORE_AGENT_ID,
		assistantId: WAPUU_ASSISTANT_ID,
		name: 'WooCommerce Store Assistant',
		description: 'Helps you manage your online store',
		agent: WooAgent,
	},
];
