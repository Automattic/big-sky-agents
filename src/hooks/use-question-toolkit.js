/**
 * WordPress dependencies
 */
import { useCallback, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import InformTool from '../ai/tools/inform-user.js';
import createSetAgentTool, {
	SET_AGENT_TOOL_NAME,
} from '../ai/tools/set-agent.js';
import AskUserTool from '../ai/tools/ask-user.js';
import SetGoalTool from '../ai/tools/set-goal.js';
import useAgents from '../components/agents-provider/use-agents.js';
import useToolkits from '../components/toolkits-provider/use-toolkits.js';

export const AGENTS_TOOLKIT_ID = 'agents';

const useQuestionToolkit = () => {
	const { registerToolkit } = useToolkits();

	useEffect( () => {
		registerToolkit( {
			name: AGENTS_TOOLKIT_ID,
			tools: [ AskUserTool ],
		} );
	}, [ registerToolkit ] );
};

export default useQuestionToolkit;
