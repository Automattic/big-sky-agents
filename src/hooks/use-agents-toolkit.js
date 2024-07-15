/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import createSetAgentTool, {
	SET_AGENT_TOOL_NAME,
} from '../ai/tools/set-agent.js';
import useAgents from '../components/agents-provider/use-agents.js';
import useToolkits from '../components/toolkits-provider/use-toolkits.js';
import AgentsToolkit from '../ai/toolkits/agents-toolkit.js';

const useAgentsToolkit = () => {
	const { agents, activeAgent, setActiveAgent } = useAgents();
	const {
		registerToolkitTools,
		registerToolkitCallbacks,
		registerToolkitContext,
	} = useToolkits();

	useEffect( () => {
		registerToolkitTools( AgentsToolkit.name, [
			createSetAgentTool( agents ),
		] );
	}, [ agents, registerToolkitTools ] );

	useEffect( () => {
		registerToolkitCallbacks( AgentsToolkit.name, {
			[ SET_AGENT_TOOL_NAME ]: ( { agentId } ) => {
				setActiveAgent( agentId );
				return `Agent set to ${ agentId }`;
			},
		} );
	}, [ registerToolkitCallbacks, setActiveAgent ] );

	useEffect( () => {
		registerToolkitContext( AgentsToolkit.name, {
			agents,
			agent: {
				id: activeAgent?.id,
				name: activeAgent?.name,
				assistantId: activeAgent?.assistantId,
			},
		} );
	}, [ registerToolkitContext, agents, activeAgent ] );
};

export default useAgentsToolkit;
