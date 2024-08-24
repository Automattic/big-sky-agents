/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { SET_AGENT_TOOL_NAME } from '../ai/tools/set-agent.js';
import useAgents from '../components/agents-provider/use-agents.js';
import useToolkits from '../components/toolkits-provider/use-toolkits.js';
import AgentsToolkit from '../ai/toolkits/agents-toolkit.js';

const useAgentsToolkit = () => {
	const { agents, activeAgent, setActiveAgent } = useAgents();
	const { setCallbacks, setContext } = useToolkits();

	useEffect( () => {
		setCallbacks( AgentsToolkit.name, {
			[ SET_AGENT_TOOL_NAME ]: ( { agentId } ) => {
				setActiveAgent( agentId );
				return `Agent set to ${ agentId }`;
			},
		} );
	}, [ setCallbacks, setActiveAgent ] );

	useEffect( () => {
		setContext( AgentsToolkit.name, {
			agents,
			agent: {
				id: activeAgent?.id,
				name: activeAgent?.name,
				assistantId: activeAgent?.assistantId,
			},
		} );
	}, [ setContext, agents, activeAgent ] );
};

export default useAgentsToolkit;
