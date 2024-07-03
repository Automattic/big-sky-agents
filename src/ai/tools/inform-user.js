export const INFORM_TOOL_NAME = 'informUser';
export default {
	name: INFORM_TOOL_NAME,
	description: "Tell the user what you're doing.",
	parameters: {
		type: 'object',
		properties: {
			message: {
				description: 'A message to for the user, in markdown format.',
				type: 'string',
			},
		},
		required: [ 'message' ],
	},
};
