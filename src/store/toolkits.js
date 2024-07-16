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
	setCallbacks: ( name, callbacks ) => {
		return {
			type: 'REGISTER_TOOLKIT_CALLBACKS',
			name,
			callbacks,
		};
	},
	setContext: ( name, context ) => {
		return {
			type: 'REGISTER_TOOLKIT_CONTEXT',
			name,
			context,
		};
	},
	setTools: ( name, tools ) => {
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

const setCallbacks = ( state, action ) => {
	const { name, callbacks } = action;
	const toolkitIndex = state.toolkits.findIndex( ( a ) => a.name === name );
	if ( toolkitIndex === -1 ) {
		// register the toolkit instead
		return registerToolkit( state, { toolkit: { name, callbacks } } );
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

const setContext = ( state, action ) => {
	const { name, context } = action;
	const toolkitIndex = state.toolkits.findIndex( ( a ) => a.name === name );
	if ( toolkitIndex === -1 ) {
		// register the toolkit instead
		return registerToolkit( state, { toolkit: { name, context } } );
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

const setTools = ( state, action ) => {
	const { name, tools } = action;
	const toolkitIndex = state.toolkits.findIndex( ( a ) => a.name === name );
	if ( toolkitIndex === -1 ) {
		// register the toolkit instead
		return registerToolkit( state, { toolkit: { name, tools } } );
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
			return setCallbacks( state, action );
		case 'REGISTER_TOOLKIT_CONTEXT':
			return setContext( state, action );
		case 'REGISTER_TOOLKIT_TOOLS':
			return setTools( state, action );
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
