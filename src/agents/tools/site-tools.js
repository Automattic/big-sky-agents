import { createSimpleTool, createTool } from './tool.js';
import pageCategories from '../../data/page-categories.json' assert { type: 'json' };
import patternCategories from '../../data/pattern-categories-brief.json' assert { type: 'json' };

export const SET_SITE_TITLE_TOOL_NAME = 'setSiteTitle';
export const SET_SITE_DESCRIPTION_TOOL_NAME = 'setSiteDescription';
export const SET_SITE_TOPIC_TOOL_NAME = 'setSiteTopic';
export const SET_SITE_LOCATION_TOOL_NAME = 'setSiteLocation';
export const SET_SITE_TYPE_TOOL_NAME = 'setSiteType';
export const SET_SITE_COLORS_TOOL_NAME = 'setSiteColors';
export const ADD_SITE_PAGE_TOOL_NAME = 'addSitePage';
export const SET_SITE_PAGES_TOOL_NAME = 'setSitePages';
export const SET_PAGE_SECTIONS_TOOL_NAME = 'setPageSections';
export const ADD_PAGE_SECTION_TOOL_NAME = 'addPageSection';
export const SET_PAGE_TITLE_TOOL_NAME = 'setPageTitle';
export const SET_PAGE_DESCRIPTION_TOOL_NAME = 'setPageDescription';
export const SET_PAGE_CATEGORY_TOOL_NAME = 'setPageCategory';

const availablePageTypesPrompt = pageCategories
	.map( ( category ) => category.slug )
	.join( ', ' );

const availablePageSectionsPrompt = patternCategories
	.map( ( category ) => `- ${ category.slug }` )
	.join( '\n' );

export const SiteTitleTool = createSimpleTool(
	'title',
	SET_SITE_TITLE_TOOL_NAME,
	'Site Title'
);

export const SiteDescriptionTool = createSimpleTool(
	'description',
	SET_SITE_DESCRIPTION_TOOL_NAME,
	'Page Description'
);
export const SiteTopicTool = createSimpleTool(
	'topic',
	SET_SITE_TOPIC_TOOL_NAME,
	'Site Topic'
);

export const SiteLocationTool = createSimpleTool(
	'location',
	SET_SITE_LOCATION_TOOL_NAME,
	'Site Location'
);

export const SiteTypeTool = createSimpleTool(
	'type',
	SET_SITE_TYPE_TOOL_NAME,
	'Site Type'
);

export const SetSiteColorsTool = createTool( {
	name: SET_SITE_COLORS_TOOL_NAME,
	description: 'Set the text, background, or accent colors of the site.',
	parameters: {
		type: 'object',
		properties: {
			textColor: {
				description: 'The color for text elements.',
				type: 'string',
			},
			backgroundColor: {
				description: 'The color for background elements.',
				type: 'string',
			},
			accentColor: {
				description: 'The color for accent elements.',
				type: 'string',
			},
		},
		required: [],
	},
} );

export const SetSitePagesTool = createTool( {
	name: SET_SITE_PAGES_TOOL_NAME,
	description: `Set the pages to be used for the site, each with a category, title, and a high-level description of its contents.
Be economical and logical in your site layout, using only the pages you need, with a clear purpose for each.`,
	parameters: {
		type: 'object',
		properties: {
			pages: {
				description: 'A list of pages for the site',
				type: 'array',
				items: {
					type: 'object',
					properties: {
						category: {
							description: `One of: ${ availablePageTypesPrompt }`,
							type: 'string',
						},
						title: {
							type: 'string',
						},
						description: {
							description:
								'A high-level description of the page contents',
							type: 'string',
						},
					},
					required: [ 'title', 'category', 'description' ],
				},
			},
		},
		required: [ 'pages' ],
	},
} );

export const SetPageSectionsTool = createTool( {
	name: SET_PAGE_SECTIONS_TOOL_NAME,
	description: `Set the sections to be used for the page, each with a category, and a high-level description of its contents.
Be economical and logical in your site layout, using only the pages you need, with a clear purpose for each.`,
	parameters: {
		type: 'object',
		properties: {
			sections: {
				description: 'A list of sections for the page',
				type: 'array',
				items: {
					type: 'object',
					properties: {
						category: {
							description: `One of: ${ availablePageSectionsPrompt }`,
							type: 'string',
						},
						description: {
							description:
								'A high-level description of the section contents',
							type: 'string',
						},
					},
					required: [ 'category', 'description' ],
				},
			},
		},
		required: [ 'sections' ],
	},
} );

export const AddSitePageTool = createTool( {
	name: ADD_SITE_PAGE_TOOL_NAME,
	description: `Add a page to the site`,
	parameters: {
		type: 'object',
		properties: {
			category: {
				description: `One of: ${ availablePageTypesPrompt }`,
				type: 'string',
			},
			title: {
				type: 'string',
			},
			description: {
				type: 'string',
			},
		},
		required: [ 'title', 'category', 'description' ],
	},
} );

export const AddPageSectionTool = createTool( {
	name: ADD_PAGE_SECTION_TOOL_NAME,
	description: `Add a section to the page`,
	parameters: {
		type: 'object',
		properties: {
			category: {
				description: `One of: ${ availablePageSectionsPrompt }`,
				type: 'string',
			},
			description: {
				type: 'string',
			},
		},
		required: [ 'title', 'category', 'description' ],
	},
} );

export const SetPageTitleTool = createSimpleTool(
	'title',
	SET_PAGE_TITLE_TOOL_NAME,
	'Set Page Title'
);

export const SetPageDescriptionTool = createSimpleTool(
	'description',
	SET_PAGE_DESCRIPTION_TOOL_NAME,
	'Set Page Description'
);

export const SetPageCategoryTool = createSimpleTool(
	'category',
	SET_PAGE_CATEGORY_TOOL_NAME,
	'Set Page Category'
);
