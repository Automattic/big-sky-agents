import { createReduxStore } from '@wordpress/data';

const DEFAULT_GOAL = "Find out the user's goal";

const initialState = {
	goal: DEFAULT_GOAL,
};

export const actions = {
	setGoal: ( goal ) => {
		return {
			type: 'SET_AGENT_GOAL',
			goal,
		};
	},
};

export const reducer = ( state = initialState, action ) => {
	switch ( action.type ) {
		case 'SET_AGENT_GOAL':
			return { ...state, goal: action.goal };
		default:
			return state;
	}
};

export const selectors = {
	getGoal: ( state ) => state.goal,
};

export const slice = {
	reducer,
	actions,
	selectors,
};

export function createGoalsStore( name, defaultValues ) {
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
