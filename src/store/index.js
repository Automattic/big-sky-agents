import { combineReducers, createReduxStore, register } from '@wordpress/data';
// import { composeWithDevTools } from 'redux-devtools-extension';

import {
	actions as authActions,
	controls as authControls,
	reducer as authReducer,
	selectors as authSelectors,
} from './auth.js';

import {
	actions as agentsActions,
	reducer as agentsReducer,
	selectors as agentsSelectors,
} from './agents.js';

import {
	actions as chatActions,
	controls as chatControls,
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

// Utility functions for namespacing
const createNamespacedSelectors = ( namespace, selectors ) => {
	const namespacedSelectors = {};
	for ( const key in selectors ) {
		if ( Object.prototype.hasOwnProperty.call( selectors, key ) ) {
			namespacedSelectors[ key ] = ( state, ...args ) =>
				selectors[ key ]( state[ namespace ], ...args );
		}
	}
	return namespacedSelectors;
};

const store = createReduxStore( 'big-sky-agent', {
	reducer: combineReducers( {
		auth: authReducer,
		agents: agentsReducer,
		messages: chatReducer,
		site: siteReducer,
		design: designReducer,
		pages: pageReducer,
		pageSections: sectionReducer,
	} ),
	actions: {
		...authActions,
		...agentsActions,
		...chatActions,
		...siteActions,
		...designActions,
		...pageActions,
		...sectionActions,
	},
	selectors: {
		...createNamespacedSelectors( 'auth', authSelectors ),
		...createNamespacedSelectors( 'agents', agentsSelectors ),
		...createNamespacedSelectors( 'messages', chatSelectors ),
		...createNamespacedSelectors( 'site', siteSelectors ),
		...createNamespacedSelectors( 'design', designSelectors ),
		...createNamespacedSelectors( 'pages', pageSelectors ),
		...createNamespacedSelectors( 'pageSections', sectionSelectors ),
	},
	resolvers: {
		// No need for resolvers if using thunks directly in actions
	},
	controls: {
		...authControls,
		...chatControls,
	},
} );

register( store );
export { store };
