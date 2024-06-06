import { requestJetpackToken } from '../utils/request-jetpack-token.ts';

const DEFAULT_STATE = {
	token: null,
	isLoading: false,
	error: null,
};

/**
 * These controls allow an async request to fetch the token
 */
export const controls = {
	async FETCH_JETPACK_TOKEN( /* action */ ) {
		return await requestJetpackToken();
	},
};

function* fetchJetpackToken() {
	yield { type: 'JETPACK_TOKEN_REQUEST' };
	try {
		const result = yield { type: 'FETCH_JETPACK_TOKEN' };
		yield { type: 'JETPACK_TOKEN_RESPONSE', token: result.token };
	} catch ( error ) {
		yield { type: 'JETPACK_TOKEN_ERROR', error: error.message };
	}
}

export const actions = {
	fetchJetpackToken,
};

export const reducer = ( state = DEFAULT_STATE, action ) => {
	switch ( action.type ) {
		case 'JETPACK_TOKEN_REQUEST':
			return {
				...state,
				isLoading: true,
				error: null,
			};
		case 'JETPACK_TOKEN_RESPONSE':
			return {
				...state,
				token: action.token,
				isLoading: false,
				error: null,
			};
		case 'JETPACK_TOKEN_ERROR':
			return {
				...state,
				isLoading: false,
				error: action.error,
			};
		default:
			return state;
	}
};

export const selectors = {
	getJetpackToken( state ) {
		return state.token;
	},
	getError( state ) {
		return state.error;
	},
	isLoading( state ) {
		return state.isLoading;
	},
};
