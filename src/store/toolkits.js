import { createReduxStore } from '@wordpress/data';

const initialState = {
	toolkits: [],
	contexts: {},
	callbacks: {},
	tools: {},
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

	// if the toolkit includes callbacks, register the callbacks
	if ( toolkit.callbacks ) {
		state = setCallbacks( state, {
			name: toolkit.name,
			callbacks: toolkit.callbacks,
		} );
	}

	// if the toolkit includes context, register the context
	if ( toolkit.context ) {
		state = setContext( state, {
			name: toolkit.name,
			context: toolkit.context,
		} );
	}

	// if the toolkit includes tools, register the tools
	if ( toolkit.tools ) {
		state = setTools( state, {
			name: toolkit.name,
			tools: toolkit.tools,
		} );
	}

	// if there's an existing toolkit with the same name, replace it
	const existingToolkitIndex = state.toolkits.findIndex(
		( t ) => t.name === toolkit.name
	);
	if ( existingToolkitIndex !== -1 ) {
		return {
			...state,
			toolkits: [
				...state.toolkits.slice( 0, existingToolkitIndex ),
				toolkit,
				...state.toolkits.slice( existingToolkitIndex + 1 ),
			],
		};
	}

	// otherwise, add the new toolkit
	return {
		...state,
		toolkits: [ ...state.toolkits, toolkit ],
	};
};

const setCallbacks = ( state, action ) => {
	const { name, callbacks } = action;
	return {
		...state,
		callbacks: {
			...state.callbacks,
			[ name ]: callbacks,
		},
	};
};

const setContext = ( state, action ) => {
	const { name, context } = action;
	return {
		...state,
		contexts: {
			...state.contexts,
			[ name ]: context,
		},
	};
};

const setTools = ( state, action ) => {
	const { name, tools } = action;
	return {
		...state,
		tools: {
			...state.tools,
			[ name ]: tools,
		},
	};
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
	getToolkit: ( state, name ) => {
		return state.toolkits[ name ];
	},
	getContexts: ( state ) => {
		return state.contexts;
	},
	getCallbacks: ( state ) => {
		return state.callbacks;
	},
	getTools: ( state ) => {
		return state.tools;
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
