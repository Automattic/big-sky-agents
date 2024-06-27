function createToolRegistry() {
	const tools = {};

	function registerTool( toolId, tool ) {
		tools[ toolId ] = tool;
	}

	function getTool( toolId ) {
		return tools[ toolId ];
	}

	return {
		registerTool,
		getTool,
	};
}

export default createToolRegistry;
