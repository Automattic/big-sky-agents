/**
 * Create a tool with one or more parameters
 *
 * @param {Object} options             The options for the tool
 * @param {string} options.name        The name of the tool
 * @param {string} options.description The description of the tool
 * @param {Object} options.parameters  The parameters of the tool in JSON schema format
 * @return {Object} The tool object
 */
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
		name,
		description,
		parameters,
	};
};

/**
 * Create a tool with a single parameter
 *
 * @param {string} name        The name of the tool
 * @param {string} description The description of the tool
 * @return {Object} The tool object
 */
export const createSimpleTool = ( name, description ) => {
	return createTool( {
		name,
		description,
		parameters: {
			type: 'object',
			properties: {
				value: {
					type: 'string',
				},
			},
			required: [ 'value' ],
		},
	} );
};
