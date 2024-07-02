import { combineReducers, createReduxStore } from '@wordpress/data';
import { createNamespacedSelectors } from './utils.js';

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
				// If tool with the same name already exists, replace it with the new tool
				const updatedAgents = [ ...state.toolkits ];
				updatedAgents[ existingToolkitIndex ] = toolkit;
				return { ...state, toolkits: updatedAgents };
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

export function createToolkitsStore( name, defaultValues ) {
	return createReduxStore( name, {
		reducer: combineReducers( { toolkits: reducer } ),
		actions,
		selectors: createNamespacedSelectors( selectors, 'toolkits' ),
		initialState: { ...initialState, ...defaultValues },
	} );
}
