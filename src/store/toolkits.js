import { createReduxStore } from '@wordpress/data';

const initialState = {
	toolkits: [],
};

export const actions = {
	registerToolkit: ( toolkit ) => {
		return {
			type: 'REGISTER_TOOLKIT',
			toolkit,
		};
	},
};

export const reducer = ( state = initialState, action ) => {
	switch ( action.type ) {
		case 'REGISTER_TOOLKIT':
			const { toolkit } = action;
			const existingToolkitIndex = state.toolkits.findIndex(
				( a ) => a.name === toolkit.name
			);

			if ( existingToolkitIndex !== -1 ) {
				// throw new Error(
				// 	`a toolkit should only be registered once: ${ toolkit.name }`
				// );
				// return state;
				// // If tool with the same name already exists, replace it with the new tool
				const updatedToolkits = [ ...state.toolkits ];
				updatedToolkits[ existingToolkitIndex ] = toolkit;
				return { ...state, toolkits: updatedToolkits };
			}
			// If tool with the same ID doesn't exist, add the new tool to the array
			return { ...state, toolkits: [ ...state.toolkits, toolkit ] };
		default:
			return state;
	}
};

export const selectors = {
	getToolkits: ( state ) => {
		return state.toolkits;
	},
};

export const slice = {
	reducer,
	actions,
	selectors,
};

export function createToolkitsStore( name, defaultValues ) {
	return createReduxStore( name, {
		reducer,
		actions,
		selectors,
		initialState: { ...initialState, ...defaultValues },
	} );
}
