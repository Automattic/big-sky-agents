import { createTool } from './tool.js';

export const SET_AGENT_TOOL_NAME = 'setAgent';

const createSetAgentTool = ( agents ) => {
	const agentDescriptionsMarkdown = agents
		.map(
			( agent ) =>
				` * ${ agent.id }: "${ agent.name }", ${ agent.description }`
		)
		.join( '\n' );
	const validAgentIds = agents.map( ( agent ) => agent.id ).join( ', ' );
	return createTool( {
		name: SET_AGENT_TOOL_NAME,
		description: `Use this to select the agent best suited to accomplish the user's goal.
		**Available agents**:
		${ agentDescriptionsMarkdown }.`,
		parameters: {
			type: 'object',
			properties: {
				agentId: {
					description: `The ID of the agent to help with the goal. One of: ${ validAgentIds }`,
					type: 'string',
				},
			},
			required: [ 'agentId' ],
		},
	} );
};

export default createSetAgentTool;
