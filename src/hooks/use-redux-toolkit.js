/**
 * WordPress dependencies
 */
import { useCallback, useMemo } from 'react';

/**
 * Internal dependencies
 */
import useReduxSiteToolkit from './use-redux-site-toolkit.js';
import useAnalyzeSiteToolkit from './use-analyze-site-toolkit.js';
import useReduxAgentToolkit from './use-redux-agent-toolkit.js';

const useReduxToolkit = ( { pageId, apiKey } ) => {
	// set and get site title, description, topic, type, location, colors, pages, page sections
	const { onReset: onSiteSpecReset, context: siteSpecContext } =
		useReduxSiteToolkit( { pageId } );

	// set and get current agent, goals, thought
	const { onReset: onAgentToolkitReset, context: agentContext } =
		useReduxAgentToolkit();

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

export default useReduxToolkit;
