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

export const AGENTS_TOOLKIT_NAME = 'agents';

const useAgentToolkit = () => {
	const { agents, activeAgent, setActiveAgent } = useAgents();
	const {
		registerToolkit,
		registerToolkitCallbacks,
		registerToolkitContext,
	} = useToolkits();

	useEffect( () => {
		registerToolkit( {
			name: AGENTS_TOOLKIT_NAME,
			tools: [ createSetAgentTool( agents ) ],
		} );
	}, [ agents, registerToolkit ] );

	useEffect( () => {
		registerToolkitCallbacks( AGENTS_TOOLKIT_NAME, {
			[ SET_AGENT_TOOL_NAME ]: ( { agentId } ) => {
				setActiveAgent( agentId );
				return `Agent set to ${ agentId }`;
			},
		} );
	}, [ registerToolkitCallbacks, setActiveAgent ] );

	useEffect( () => {
		registerToolkitContext( AGENTS_TOOLKIT_NAME, {
			agents,
			agent: {
				id: activeAgent?.id,
				name: activeAgent?.name,
				assistantId: activeAgent?.assistantId,
			},
		} );
	}, [ registerToolkitContext, agents, activeAgent ] );
};

export default useAgentToolkit;
