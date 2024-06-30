/**
 * An agent which helps the user clarify their site goals
 */

import { createTool } from './tool.js';

export const CONFIRM_TOOL_NAME = 'finish';

export default createTool( {
	name: CONFIRM_TOOL_NAME,
	description: `Call this tool when you have accomplished the goal. This allows the user to approve or reject the changes you have made.`,
	parameters: {
		type: 'object',
		properties: {
			message: {
				type: 'string',
				description:
					'A helpful messaging informing the user of how you accomplished the goal',
			},
		},
		required: [ 'message' ],
	},
} );
