export const toOpenAITool = ( tool ) => {
	// default to a single string parameter called "value"
	const parameters = tool.parameters ?? {
		type: 'object',
		properties: {
			value: {
				type: 'string',
			},
		},
		required: [ 'value' ],
	};

	// enable structured output if strict is true
	parameters.additionalProperties = ! tool.strict;
	return {
		type: 'function',
		function: {
			name: tool.name,
			strict: !! tool.strict,
			description: tool.description,
			parameters,
		},
	};
};

export const toAssistantOpenAITool = ( tool ) => {
	const openAITool = toOpenAITool( tool );
	// remove "strict" prop
	delete openAITool.strict;
	return openAITool;
};
