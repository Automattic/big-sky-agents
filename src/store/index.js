import { combineReducers, createReduxStore, register } from '@wordpress/data';
import { createNamespacedSelectors } from './utils.js';
import {
	actions as agentsActions,
	reducer as agentsReducer,
	selectors as agentsSelectors,
} from './agents.js';

import {
	actions as toolsActions,
	reducer as toolsReducer,
	selectors as toolsSelectors,
} from './tools.js';

import {
	actions as toolkitsActions,
	reducer as toolkitsReducer,
	selectors as toolkitsSelectors,
} from './toolkits.js';

import {
	actions as chatActions,
	reducer as chatReducer,
	selectors as chatSelectors,
} from './chat.js';

import {
	actions as siteActions,
	reducer as siteReducer,
	selectors as siteSelectors,
} from './site.js';

import {
	actions as designActions,
	reducer as designReducer,
	selectors as designSelectors,
} from './design.js';

import {
	actions as pageActions,
	reducer as pageReducer,
	selectors as pageSelectors,
} from './pages.js';

import {
	actions as sectionActions,
	reducer as sectionReducer,
	selectors as sectionSelectors,
} from './page-sections.js';

const store = createReduxStore( 'big-sky-agents', {
	reducer: combineReducers( {
		agents: agentsReducer,
		tools: toolsReducer,
		toolkits: toolkitsReducer,
		chat: chatReducer,
		site: siteReducer,
		design: designReducer,
		pages: pageReducer,
		pageSections: sectionReducer,
	} ),
	actions: {
		...agentsActions,
		...toolsActions,
		...toolkitsActions,
		...chatActions,
		...siteActions,
		...designActions,
		...pageActions,
		...sectionActions,
	},
	selectors: {
		...createNamespacedSelectors( 'agents', agentsSelectors ),
		...createNamespacedSelectors( 'tools', toolsSelectors ),
		...createNamespacedSelectors( 'toolkits', toolkitsSelectors ),
		...createNamespacedSelectors( 'chat', chatSelectors ),
		...createNamespacedSelectors( 'site', siteSelectors ),
		...createNamespacedSelectors( 'design', designSelectors ),
		...createNamespacedSelectors( 'pages', pageSelectors ),
		...createNamespacedSelectors( 'pageSections', sectionSelectors ),
	},
} );

register( store );
export { store };
