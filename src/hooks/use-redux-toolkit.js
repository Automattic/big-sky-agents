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

const useReduxToolkit = ( { pageId, token } ) => {
	// set and get site title, description, topic, type, location, colors, pages, page sections
	const {
		onReset: onSiteSpecReset,
		tools: siteSpecTools,
		values: siteSpecValues,
		callbacks: siteSpecCallbacks,
	} = useReduxSiteToolkit( { pageId } );

	// set and get current agent, goals, thought
	const {
		onReset: onAgentToolkitReset,
		tools: agentTools,
		values: agentValues,
		callbacks: agentCallbacks,
	} = useReduxAgentToolkit();

	// get site analysis
	const {
		tools: analyzeSiteTools,
		values: analyzeSiteValues,
		callbacks: analyzeSiteCallbacks,
	} = useAnalyzeSiteToolkit( { token } );

	// these are fed to the templating engine on each render of the system/after-call prompt
	const values = useMemo(
		() => ( {
			...siteSpecValues,
			...agentValues,
			...analyzeSiteValues,
		} ),
		[ agentValues, analyzeSiteValues, siteSpecValues ]
	);

	const callbacks = useMemo( () => {
		return {
			...siteSpecCallbacks,
			...agentCallbacks,
			...analyzeSiteCallbacks,
		};
	}, [ agentCallbacks, analyzeSiteCallbacks, siteSpecCallbacks ] );

	const tools = useMemo( () => {
		return [ ...siteSpecTools, ...agentTools, ...analyzeSiteTools ];
	}, [ agentTools, analyzeSiteTools, siteSpecTools ] );

	const onReset = useCallback( () => {
		onSiteSpecReset();
		onAgentToolkitReset();
	}, [ onSiteSpecReset, onAgentToolkitReset ] );

	return {
		tools,
		values,
		callbacks,
		onReset,
	};
};

export default useReduxToolkit;
