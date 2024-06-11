const initialState = {
	textColor: '#000000',
	backgroundColor: '#ffffff',
	accentColor: '#0073aa',
};

export const actions = {
	setTextColor: ( value ) => {
		return {
			type: 'SET_TEXT_COLOR',
			value,
		};
	},
	setBackgroundColor: ( value ) => {
		return {
			type: 'SET_BACKGROUND_COLOR',
			value,
		};
	},
	setAccentColor: ( value ) => {
		return {
			type: 'SET_ACCENT_COLOR',
			value,
		};
	},
};

export const reducer = ( state = initialState, action ) => {
	switch ( action.type ) {
		case 'SET_TEXT_COLOR':
			return { ...state, textColor: action.value };
		case 'SET_BACKGROUND_COLOR':
			return { ...state, backgroundColor: action.value };
		case 'SET_ACCENT_COLOR':
			return { ...state, accentColor: action.value };
		default:
			return state;
	}
};

export const selectors = {
	getTextColor: ( state ) => state.textColor,
	getBackgroundColor: ( state ) => state.backgroundColor,
	getAccentColor: ( state ) => state.accentColor,
};
