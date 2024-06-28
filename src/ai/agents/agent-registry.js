import Agent from './agent.js';

function createAgentRegistry() {
	const agents = {};

	function registerAgent( agentId, agent ) {
		// if agentId is a subclass of Agent, construct the config from that
		if ( agentId instanceof Agent ) {
			// handle registering an instance of an agent
			const agentInstance = agentId;
			agentId = agentInstance.getId();
			agent = {
				id: agent.id,
				description: agent.getDescription(),
				toolkits: agent.getToolkits(),
				// can be a string or a function that accepts 'context' param
				instructions: ( context ) =>
					agentInstance.getInstructions( context ),
				// can be a string or a function that accepts 'context' param
				additionalInstructions: ( context ) =>
					agentInstance.getAdditionalInstructions( context ),
				// can be an array of tools or a function that accepts 'context' param
				tools: ( context ) => agentInstance.getTools( context ),
				onStart: ( chat, context ) => {
					agentInstance.onStart( chat, context );
				},
				onConfirm: ( chat, context, confirmed ) => {
					agentInstance.onConfirm( confirmed, chat, context );
				},
			};
		} else {
			agent.id = agentId;
		}

		agents[ agentId ] = agent;
	}

	function getAgent( agentId ) {
		return agents[ agentId ];
	}

	function getAgents() {
		return Object.values( agents );
	}

	return {
		registerAgent,
		getAgent,
		getAgents,
	};
}

export default createAgentRegistry;
