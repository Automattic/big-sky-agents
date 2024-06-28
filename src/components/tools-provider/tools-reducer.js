export const initialState = {
	tools: [],
};

export function toolsReducer( state, action ) {
	switch ( action.type ) {
		case 'REGISTER_TOOL':
			const { tool } = action.payload;
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
}
