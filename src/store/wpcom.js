import { createReduxStore } from '@wordpress/data';

const initialState = {
	wpcomClientId: '',
	wpcomOauthToken: '',
	wpcomUserInfo: {},
};

export const actions = {
	setWpcomOauthToken: ( token ) => ( {
		type: 'SET_WPCOM_OAUTH_TOKEN',
		token,
	} ),
	setWpcomClientId: ( clientId ) => ( {
		type: 'SET_WPCOM_CLIENT_ID',
		clientId,
	} ),
	// New action
	setWpcomOauthRedirectUri: ( redirectUri ) => ( {
		type: 'SET_WPCOM_OAUTH_REDIRECT_URI',
		redirectUri,
	} ),
	setWpcomUserInfo: ( userInfo ) => ( {
		type: 'SET_WPCOM_USER_INFO',
		userInfo,
	} ),
};

export const reducer = ( state = initialState, action ) => {
	switch ( action.type ) {
		case 'SET_WPCOM_OAUTH_TOKEN':
			return { ...state, wpcomOauthToken: action.token };
		case 'SET_WPCOM_CLIENT_ID':
			return { ...state, wpcomClientId: action.clientId };
		// New case
		case 'SET_WPCOM_OAUTH_REDIRECT_URI':
			return { ...state, wpcomOauthRedirectUri: action.redirectUri };
		case 'SET_WPCOM_USER_INFO':
			return { ...state, userInfo: action.userInfo };
		default:
			return state;
	}
};

export const selectors = {
	getWpcomClientId: ( state ) => state.wpcomClientId,
	getWpcomOauthToken: ( state ) => state.wpcomOauthToken,
	// New selector
	getWpcomOauthRedirectUri: ( state ) => state.wpcomOauthRedirectUri,
	getWpcomUserInfo: ( state ) => state.userInfo,
};

export const slice = {
	reducer,
	actions,
	selectors,
};

export function createTokenStore( name, defaultValues ) {
	return createReduxStore( name, {
		reducer,
		actions,
		selectors,
		initialState: {
			...initialState,
			...defaultValues,
		},
	} );
}
