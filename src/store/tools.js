import { combineReducers, createReduxStore } from '@wordpress/data';
import { createNamespacedSelectors } from './utils.js';

const initialState = {
	tools: [],
};

export const actions = {
	registerTool: ( tool ) => {
		return {
			type: 'REGISTER_TOOL',
			tool,
		};
	},
};

export const reducer = ( state = initialState, action ) => {
	switch ( action.type ) {
		case 'REGISTER_TOOL':
			const { tool } = action;
			const existingToolIndex = state.tools.findIndex(
				( a ) => a.name === tool.name
			);

			if ( existingToolIndex !== -1 ) {
				// If tool with the same name already exists, replace it with the new tool
				const updatedAgents = [ ...state.tools ];
				updatedAgents[ existingToolIndex ] = tool;
				return { ...state, tools: updatedAgents };
			}
			// If tool with the same ID doesn't exist, add the new tool to the array
			return { ...state, tools: [ ...state.tools, tool ] };
		default:
			return state;
	}
};

export const selectors = {
	getTools: ( state ) => {
		return state.tools;
	},
};

export function createToolsStore( name, defaultValues ) {
	return createReduxStore( name, {
		reducer: combineReducers( { tools: reducer } ),
		actions,
		selectors: createNamespacedSelectors( selectors, 'tools' ),
		initialState: { ...initialState, ...defaultValues },
	} );
}
