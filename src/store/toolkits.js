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
	registerToolkitCallbacks: ( name, callbacks ) => {
		return {
			type: 'REGISTER_TOOLKIT_CALLBACKS',
			name,
			callbacks,
		};
	},
	registerToolkitContext: ( name, context ) => {
		return {
			type: 'REGISTER_TOOLKIT_CONTEXT',
			name,
			context,
		};
	},
	registerToolkitTools: ( name, tools ) => {
		return {
			type: 'REGISTER_TOOLKIT_TOOLS',
			name,
			tools,
		};
	},
};

const registerToolkit = ( state, action ) => {
	const { toolkit } = action;
	const existingToolkitIndex = state.toolkits.findIndex(
		( a ) => a.name === toolkit.name
	);

	if ( existingToolkitIndex !== -1 ) {
		const updatedToolkits = [ ...state.toolkits ];
		updatedToolkits[ existingToolkitIndex ] = toolkit;
		return { ...state, toolkits: updatedToolkits };
	}
	// If tool with the same ID doesn't exist, add the new tool to the array
	return { ...state, toolkits: [ ...state.toolkits, toolkit ] };
};

const registerToolkitCallbacks = ( state, action ) => {
	const { name, callbacks } = action;
	const toolkitIndex = state.toolkits.findIndex( ( a ) => a.name === name );
	if ( toolkitIndex === -1 ) {
		throw new Error( `toolkit not found for callbacks: ${ name }` );
	}
	const toolkitToUpdate = state.toolkits[ toolkitIndex ];
	const updatedToolkit = {
		...toolkitToUpdate,
		callbacks,
	};
	const updatedToolkits = [ ...state.toolkits ];
	updatedToolkits[ toolkitIndex ] = updatedToolkit;
	return { ...state, toolkits: updatedToolkits };
};

const registerToolkitContext = ( state, action ) => {
	const { name, context } = action;
	const toolkitIndex = state.toolkits.findIndex( ( a ) => a.name === name );
	if ( toolkitIndex === -1 ) {
		throw new Error( `toolkit not found for context: ${ name }` );
	}
	const toolkitToUpdate = state.toolkits[ toolkitIndex ];
	const updatedToolkit = {
		...toolkitToUpdate,
		context,
	};
	const updatedToolkits = [ ...state.toolkits ];
	updatedToolkits[ toolkitIndex ] = updatedToolkit;
	return { ...state, toolkits: updatedToolkits };
};

const registerToolkitTools = ( state, action ) => {
	const { name, tools } = action;
	const toolkitIndex = state.toolkits.findIndex( ( a ) => a.name === name );
	if ( toolkitIndex === -1 ) {
		throw new Error(
			`toolkit not found then registering tools: ${ name }`
		);
	}
	const toolkitToUpdate = state.toolkits[ toolkitIndex ];
	const updatedToolkit = {
		...toolkitToUpdate,
		tools,
	};
	const updatedToolkits = [ ...state.toolkits ];
	updatedToolkits[ toolkitIndex ] = updatedToolkit;
	return { ...state, toolkits: updatedToolkits };
};

export const reducer = ( state = initialState, action ) => {
	switch ( action.type ) {
		case 'REGISTER_TOOLKIT':
			return registerToolkit( state, action );
		case 'REGISTER_TOOLKIT_CALLBACKS':
			return registerToolkitCallbacks( state, action );
		case 'REGISTER_TOOLKIT_CONTEXT':
			return registerToolkitContext( state, action );
		case 'REGISTER_TOOLKIT_TOOLS':
			return registerToolkitTools( state, action );
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
