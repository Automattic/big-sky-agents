/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as agentStore } from '../store/index.js';
import InformTool from '../ai/tools/inform-user.js';
import createSetAgentTool, {
	SET_AGENT_TOOL_NAME,
} from '../ai/tools/set-agent.js';
import AskUserTool from '../ai/tools/ask-user.js';
import SetGoalTool from '../ai/tools/set-goal.js';
import useAgents from '../components/agents-provider/use-agents.js';
import useToolkits from '../components/toolkits-provider/use-toolkits.js';

const useAgentToolkit = () => {
	const { agents, activeAgent, setActiveAgent } = useAgents();
	const { registerToolkit } = useToolkits();
	const { setAgentThought, setAgentGoal } = useDispatch( agentStore );
	const { goal, thought } = useSelect( ( select ) => ( {
		goal: select( agentStore ).getAgentGoal(),
		thought: select( agentStore ).getAgentThought(),
	} ) );

	const [ tools, setTools ] = useState( [] );

	useEffect( () => {
		setTools( [
			AskUserTool,
			SetGoalTool,
			InformTool,
			createSetAgentTool( agents ),
		] );
	}, [ agents ] );

	const onReset = useCallback( () => {
		setAgentGoal( null );
		setAgentThought( null );
	}, [ setAgentGoal, setAgentThought ] );

	useEffect( () => {
		registerToolkit( {
			name: 'agents',
			tools,
			callbacks: {
				[ InformTool.name ]: ( { message } ) => {
					setAgentThought( message );
					return message
						? `Agent thinks: "${ message }"`
						: 'Thought cleared';
				},
				[ SetGoalTool.name ]: ( { goal: newGoal } ) => {
					setAgentGoal( newGoal );
					return `Goal set to "${ newGoal }"`;
				},
				[ SET_AGENT_TOOL_NAME ]: ( { agentId } ) => {
					setActiveAgent( agentId );
					return `Agent set to ${ agentId }`;
				},
			},
			context: {
				agents,
				agent: {
					id: activeAgent?.id,
					assistantId: activeAgent?.assistantId,
					goal,
					thought,
				},
			},
			reset: onReset,
		} );
	}, [
		agents,
		activeAgent,
		goal,
		thought,
		registerToolkit,
		tools,
		setAgentThought,
		setAgentGoal,
		setActiveAgent,
		onReset,
	] );
};

export default useAgentToolkit;
