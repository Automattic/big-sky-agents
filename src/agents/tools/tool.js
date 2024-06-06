export const createTool = ( { name, description, parameters } ) => {
	if ( ! name ) {
		throw new Error( 'Missing tool name' );
	}
	if ( ! description ) {
		throw new Error( 'Missing tool description' );
	}
	if ( typeof parameters === 'undefined' ) {
		// single input schema
		parameters = {
			type: 'object',
			properties: {
				input: {
					type: 'string',
				},
			},
			required: [ 'input' ],
		};
	}
	return {
		type: 'function',
		function: {
			name,
			description,
			parameters,
		},
	};
};

export const createSimpleTool = ( propName, name, description ) => {
	return createTool( {
		name,
		description,
		parameters: {
			type: 'object',
			properties: {
				[ propName ]: {
					type: 'string',
				},
			},
			required: [ propName ],
		},
	} );
};
