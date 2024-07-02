/**
 * WordPress dependencies
 */
import { useCallback, useMemo } from 'react';

/**
 * Internal dependencies
 */
import useSiteToolkit from './use-site-toolkit.js';
import useAnalyzeSiteToolkit from './use-analyze-site-toolkit.js';
import useAgentToolkit from './use-agent-toolkit.js';

const useToolkit = ( { pageId, apiKey } ) => {
	// set and get site title, description, topic, type, location, colors, pages, page sections
	const { onReset: onSiteSpecReset, context: siteSpecContext } =
		useSiteToolkit( { pageId } );

	// set and get current agent, goals, thought
	const { onReset: onAgentToolkitReset, context: agentContext } =
		useAgentToolkit();

	// get site analysis
	useAnalyzeSiteToolkit( { apiKey } );

	// these are fed to the templating engine on each render of the system/after-call prompt
	const context = useMemo(
		() => ( {
			...siteSpecContext,
			...agentContext,
		} ),
		[ agentContext, siteSpecContext ]
	);

	const onReset = useCallback( () => {
		onSiteSpecReset();
		onAgentToolkitReset();
	}, [ onSiteSpecReset, onAgentToolkitReset ] );

	return {
		context,
		onReset,
	};
};

export default useToolkit;
