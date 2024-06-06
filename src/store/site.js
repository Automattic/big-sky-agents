const initialState = {
	title: '',
	description: '',
	topic: '',
	location: '',
	type: '',
};

export const actions = {
	setSiteType: ( siteType ) => {
		return {
			type: 'SET_SITE_TYPE',
			siteType,
		};
	},
	setSiteTitle: ( title ) => {
		return {
			type: 'SET_SITE_TITLE',
			title,
		};
	},
	setSiteDescription: ( description ) => {
		return {
			type: 'SET_SITE_DESCRIPTION',
			description,
		};
	},
	setSiteTopic: ( topic ) => {
		return {
			type: 'SET_SITE_TOPIC',
			topic,
		};
	},
	setSiteLocation: ( location ) => {
		return {
			type: 'SET_SITE_LOCATION',
			location,
		};
	},
};

export const reducer = ( state = initialState, action ) => {
	switch ( action.type ) {
		case 'SET_SITE_TYPE':
			return { ...state, type: action.siteType };
		case 'SET_SITE_TITLE':
			return { ...state, title: action.title };
		case 'SET_SITE_DESCRIPTION':
			return { ...state, description: action.description };
		case 'SET_SITE_TOPIC':
			return { ...state, topic: action.topic };
		case 'SET_SITE_LOCATION':
			return { ...state, location: action.location };
		default:
			return state;
	}
};

export const selectors = {
	getSiteType: ( state ) => state.type,
	getSiteTitle: ( state ) => state.title,
	getSiteDescription: ( state ) => state.description,
	getSiteTopic: ( state ) => state.topic,
	getSiteLocation: ( state ) => state.location,
};
