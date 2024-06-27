function createToolkitRegistry() {
	const tools = {};

	function registerToolkit( toolkitId, toolkit ) {
		tools[ toolkitId ] = toolkit;
	}

	function getToolkit( toolkitId ) {
		return tools[ toolkitId ];
	}

	return {
		registerToolkit,
		getToolkit,
	};
}

export default createToolkitRegistry;
