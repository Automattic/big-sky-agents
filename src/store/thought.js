import { createReduxStore } from '@wordpress/data';

const initialState = {
	thought: null,
};

export const actions = {
	setThought: ( thought ) => {
		return {
			type: 'SET_AGENT_THOUGHT',
			thought,
		};
	},
};

export const reducer = ( state = initialState, action ) => {
	switch ( action.type ) {
		case 'SET_AGENT_THOUGHT':
			return { ...state, thought: action.thought };
		default:
			return state;
	}
};

export const selectors = {
	getThought: ( state ) => state.thought,
};

export const slice = {
	reducer,
	actions,
	selectors,
};

export function createThoughtStore( name, defaultValues ) {
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
