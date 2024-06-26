/**
 * WordPress dependencies
 */
import { useCallback, useMemo } from 'react';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import useReduxSiteToolkit from './use-redux-site-toolkit.js';
import useAnalyzeSiteToolkit from './use-analyze-site-toolkit.js';

import BaseAgentToolkit from '../agents/toolkits/base-agent.js';
import ReduxStateManager from '../agents/state-managers/redux.js';
import agents from '../agents/default-agents.js';

import { store as agentStore } from '../store/index.js';

const useReduxToolkit = ( { pageId, apiKey } ) => {
	// set and get site title, description, topic, type, location, colors, pages, page sections
	const {
		onReset: onSiteSpecReset,
		tools: siteSpecTools,
		values: siteSpecValues,
		callbacks: siteSpecCallbacks,
	} = useReduxSiteToolkit( { pageId } );

	// set and get current agent, goals, thought
	const baseAgentToolkit = new BaseAgentToolkit(
		{ agents },
		new ReduxStateManager(
			useSelect( agentStore ).getAgentState,
			useDispatch( agentStore ).setAgentState,
			useDispatch( agentStore ).resetAgentState
		)
	);
	const agentValues = baseAgentToolkit.getValues();
	const agentCallbacks = baseAgentToolkit.getCallbacks();
	const agentTools = baseAgentToolkit.getTools();
	const onAgentToolkitReset = baseAgentToolkit.onReset;

	// get site analysis
	const {
		tools: analyzeSiteTools,
		values: analyzeSiteValues,
		callbacks: analyzeSiteCallbacks,
	} = useAnalyzeSiteToolkit( { apiKey } );

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
