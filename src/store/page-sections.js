import uuidv4 from '../utils/uuid.js';

const initialState = {
	sections: [],
};

function filterSection( pageId, section ) {
	return {
		...section,
		pageId,
		id: section.id ?? uuidv4(),
	};
}

function getSection( state, pageId, sectionId ) {
	return state.sections.find(
		( section ) => section.pageId === pageId && section.id === sectionId
	);
}

const updateSectionProperty = ( state, pageId, sectionId, property, value ) => {
	return {
		...state,
		sections: state.sections.map( ( section ) => {
			if ( section.pageId === pageId && section.id === sectionId ) {
				return {
					...section,
					[ property ]: value,
				};
			}
			return section;
		} ),
	};
};

export const actions = {
	addPageSection: ( pageId, section ) => {
		return {
			type: 'ADD_PAGE_SECTION',
			section: filterSection( pageId, section ),
		};
	},
	setPageSections: ( pageId, { sections } ) => {
		return {
			type: 'SET_PAGE_SECTIONS',
			pageId,
			sections: sections.map( filterSection.bind( null, pageId ) ),
		};
	},
	setSectionDescription: ( pageId, sectionId, description ) => {
		return {
			type: 'SET_SECTION_DESCRIPTION',
			pageId,
			sectionId,
			description,
		};
	},
	setSectionCategory: ( pageId, sectionId, category ) => {
		return {
			type: 'SET_SECTION_CATEGORY',
			pageId,
			sectionId,
			category,
		};
	},
};

export const reducer = ( state = initialState, action ) => {
	switch ( action.type ) {
		case 'ADD_PAGE_SECTION':
			return {
				...state,
				sections: [ ...state.sections, action.section ],
			};
		case 'SET_PAGE_SECTIONS':
			return {
				...state,
				sections: state.sections
					.filter( ( section ) => section.pageId !== action.pageId )
					.concat( action.sections ),
			};
		case 'SET_SECTION_DESCRIPTION':
			return updateSectionProperty(
				state,
				action.pageId,
				action.sectionId,
				'description',
				action.description
			);
		case 'SET_SECTION_CATEGORY':
			return updateSectionProperty(
				state,
				action.pageId,
				action.sectionId,
				'category',
				action.category
			);
		default:
			return state;
	}
};

export const selectors = {
	getSection,
	getPageSections: ( state, pageId ) => {
		return state.sections.filter(
			( section ) => section.pageId === pageId
		);
	},
	getSectionDescription: ( state, pageId, sectionId ) => {
		return getSection( state, pageId, sectionId )?.description;
	},
	getSectionCategory: ( state, pageId, sectionId ) => {
		return getSection( state, pageId, sectionId )?.category;
	},
};
