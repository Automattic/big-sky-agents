/**
 * WordPress dependencies
 */
import { useCallback, useMemo } from 'react';

/**
 * Internal dependencies
 */
import useSimpleSiteToolkit from './use-simple-site-toolkit.js';
import useSimpleAgentToolkit from './use-simple-agent-toolkit.js';
import useAnalyzeSiteToolkit from './use-analyze-site-toolkit.js';
import agents from '../../agents/default-agents.js';

/**
 * This attempts to provide all the "glue" between the Agents and the current environment.
 *
 * In theory we could call agents from the CLI etc by just providing the proper environment.
 *
 * In this version, we don't use redux, just local state.
 *
 * @param {Object} options
 * @param {string} options.pageId
 * @param {string} options.token
 * @return {Object} tools, values, callbacks, onReset
 */
const useSimpleToolkit = ( { pageId, token } ) => {
	// basic tools like askUser, informUser, setAgentGoal, etc.
	const {
		onReset: onResetAgent,
		tools: agentTools,
		values: agentValues,
		callbacks: agentCallbacks,
	} = useSimpleAgentToolkit( { agents } );

	// modify site settings, pages and content
	const {
		onReset: onResetSiteToolkit,
		tools: siteSpecTools,
		values: siteSpecValues,
		callbacks: siteSpecCallbacks,
	} = useSimpleSiteToolkit( { pageId } );

	// analyze sites using a remote browser and vision model
	const {
		tools: analyzeSiteTools,
		values: analyzeSiteValues,
		callbacks: analyzeSiteCallbacks,
	} = useAnalyzeSiteToolkit( { token } );

	// reset pending tool calls
	const onReset = useCallback( () => {
		onResetSiteToolkit();
		onResetAgent();
	}, [ onResetSiteToolkit, onResetAgent ] );

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

	return {
		// tools-related
		tools,
		values,
		callbacks,

		// reset pending tool calls and goal
		onReset,
	};
};

export default useSimpleToolkit;
