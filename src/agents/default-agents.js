export const WAPUU_AGENT_ID = 'Wapuu';
export const WAPUU_ASSISTANT_ID = 'asst_jTIeJ557zgwPMWORuBt4vGOz';
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
	},
	{
		id: WORDPRESS_SITE_SPEC_AGENT_ID,
		name: 'Site Settings and Pages Assistant',
		description:
			'Set site title, description, type, topic, location and pages.',
	},
	{
		id: WORDPRESS_PAGE_SPEC_AGENT_ID,
		name: 'Page Content Assistant',
		description:
			'Add and edit pages, set page title, description, category, and sections.',
	},
	{
		id: WORDPRESS_DESIGN_AGENT_ID,
		name: 'Design Assistant',
		description:
			'Helps you design your site, set fonts and colors, etc. Can also analyze any URL to extract style and layout information.',
	},
	{
		id: WORDPRESS_TUTOR_AGENT_ID,
		name: 'WordPress Tutor',
		description:
			'Helps you learn about WordPress, joining the community, and more',
	},
	{
		id: JETPACK_STATS_AGENT_ID,
		name: 'Site Stats Assistant',
		description: "Helps you understand your site's traffic and SEO",
	},
	{
		id: WOO_STORE_AGENT_ID,
		name: 'WooCommerce Store Assistant',
		description: 'Helps you manage your online store',
	},
];
