export const ASK_USER_TOOL_NAME = 'askUser';

export default {
	name: ASK_USER_TOOL_NAME,
	description:
		'Ask the user a question. Always provide a list of choices if possible, to help the user decide.',
	parameters: {
		type: 'object',
		properties: {
			question: {
				description: 'A question in markdown format',
				type: 'string',
			},
			placeholder: {
				description: 'Placeholder text, e.g. "A location" or "A name"',
				type: 'string',
			},
			choices: {
				description: 'Suggested answers or choices for the user',
				type: 'array',
				items: {
					type: 'string',
				},
			},
			multiChoice: {
				description: 'Allow user to select multiple choices',
				type: 'boolean',
				default: false,
			},
		},
		required: [ 'question' ],
	},
};
