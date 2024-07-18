import createSetAgentTool from '../tools/set-agent.js';

export default {
	name: 'agents',
	tools: ( context ) => [ createSetAgentTool( context.agents ) ],
};
