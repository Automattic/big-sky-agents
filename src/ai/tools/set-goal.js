import { createTool } from './tool.js';

export const SET_AGENT_GOAL_TOOL_NAME = 'setGoal';

export default createTool( {
	name: SET_AGENT_GOAL_TOOL_NAME,
	description: `Use this to set the current goal of the session. Call this tool when you think the goal has changed.`,
	parameters: {
		type: 'object',
		properties: {
			goal: {
				description: 'The goal of the current conversation.',
				type: 'string',
			},
		},
		required: [ 'goal' ],
	},
} );
