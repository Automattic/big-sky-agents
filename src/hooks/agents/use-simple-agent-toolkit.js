/**
 * WordPress dependencies
 */
import { useCallback, useMemo, useState } from 'react';

/**
 * Internal dependencies
 */
import InformTool, {
	INFORM_TOOL_NAME,
} from '../../agents/tools/inform-user.js';
import AskUserTool from '../../agents/tools/ask-user.js';
import createSetAgentTool, {
	SET_AGENT_TOOL_NAME,
} from '../../agents/tools/set-agent.js';
import SetGoalTool, {
	SET_AGENT_GOAL_TOOL_NAME,
} from '../../agents/tools/set-goal.js';

const useSimpleAgentToolkit = ({ agents }) => {
	const [ agentId, setAgent ] = useState();
	const [ agentGoal, setAgentGoal ] = useState(
		"Understand the user's goal"
	);
	const [ agentThought, setAgentThought ] = useState();

	// these are fed to the templating engine on each render of the system/after-call prompt
	const values = useMemo( () => {
		return {
			agents,
			agent: {
				id: agentId,
				name: agents.find( ( agent ) => agent.id === agentId )?.name,
				goal: agentGoal,
				thought: agentThought,
			},
		};
	}, [ agentId, agentGoal, agentThought ] );

	const callbacks = useMemo( () => {
		return {
			[ SET_AGENT_TOOL_NAME ]: ( { agentId: newAgentId } ) => {
				setAgent( newAgentId );
				return `Agent set to ${ newAgentId }`;
			},
			[ SET_AGENT_GOAL_TOOL_NAME ]: ( { goal } ) => {
				setAgentGoal( goal );
				return `Goal set to "${ goal }"`;
			},
			[ INFORM_TOOL_NAME ]: ( { message } ) => {
				setAgentThought( message );
				return message
					? `Agent thinks: "${ message }"`
					: 'Thought cleared';
			},
		};
	}, [] );

	const tools = useMemo( () => {
		return [
			createSetAgentTool( values.agents ),
			InformTool,
			AskUserTool,
			SetGoalTool,
		];
	}, [ values.agents ] );

	const onReset = useCallback( () => {
		setAgentGoal( null );
		setAgentThought( null );
	}, [] );

	return {
		onReset,
		tools,
		values,
		callbacks,
	};
};

export default useSimpleAgentToolkit;
