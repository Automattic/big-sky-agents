export const toOpenAITool = ( tool ) => ( {
	type: 'function',
	function: {
		name: tool.name,
		description: tool.description,
		// default to a single string parameter called "value"
		parameters: tool.parameters ?? {
			type: 'object',
			properties: {
				value: {
					type: 'string',
				},
			},
			required: [ 'value' ],
		},
	},
} );
