import uuidv4 from '../utils/uuid.js';

const initialState = {
	pages: [],
};

function filterPage( page ) {
	return {
		...page,
		id: page.id ?? uuidv4(),
	};
}

const getPage = ( state, pageId ) =>
	state.pages.find( ( page ) => page.id === pageId );

const updatePageProperty = ( state, pageId, property, value ) => {
	return {
		...state,
		pages: state.pages.map( ( page ) =>
			page.id === pageId ? { ...page, [ property ]: value } : page
		),
	};
};

export const actions = {
	addPage: ( page ) => {
		return {
			type: 'ADD_SITE_PAGE',
			page: filterPage( page ),
		};
	},
	setPages: ( pages ) => {
		return {
			type: 'SET_SITE_PAGES',
			pages: pages.map( filterPage ),
		};
	},
	setPageTitle: ( pageId, title ) => {
		return {
			type: 'SET_PAGE_TITLE',
			pageId,
			title,
		};
	},
	setPageDescription: ( pageId, description ) => {
		return {
			type: 'SET_PAGE_DESCRIPTION',
			pageId,
			description,
		};
	},
	setPageCategory: ( pageId, category ) => {
		return {
			type: 'SET_PAGE_CATEGORY',
			pageId,
			category,
		};
	},
};

export const reducer = ( state = initialState, action ) => {
	switch ( action.type ) {
		case 'SET_SITE_PAGES':
			return { ...state, pages: action.pages };
		case 'ADD_SITE_PAGE':
			return {
				...state,
				pages: [ ...state.pages, action.page ],
			};
		case 'SET_PAGE_TITLE':
			return updatePageProperty(
				state,
				action.pageId,
				'title',
				action.title
			);
		case 'SET_PAGE_DESCRIPTION':
			return updatePageProperty(
				state,
				action.pageId,
				'description',
				action.description
			);
		case 'SET_PAGE_CATEGORY':
			return updatePageProperty(
				state,
				action.pageId,
				'category',
				action.category
			);
		default:
			return state;
	}
};

export const selectors = {
	getPage,
	getPages: ( state ) => state.pages,
	getPageTitle: ( state, pageId ) => {
		return getPage( state, pageId )?.title;
	},
	getPageDescription: ( state, pageId ) => {
		return getPage( state, pageId )?.description;
	},
	getPageCategory: ( state, pageId ) => {
		return getPage( state, pageId )?.category;
	},
};
