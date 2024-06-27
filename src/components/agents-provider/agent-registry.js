function createAgentRegistry() {
	const agents = {};

	function registerAgent( agentId, agent ) {
		agents[ agentId ] = agent;
	}

	function getAgent( agentId ) {
		return agents[ agentId ];
	}

	return {
		registerAgent,
		getAgent,
	};
}

export default createAgentRegistry;
