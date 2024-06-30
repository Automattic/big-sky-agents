/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useMemo } from 'react';

/**
 * Internal dependencies
 */
import { store as agentStore } from '../store/index.js';
import InformTool from '../ai/tools/inform-user.js';
import createSetAgentTool from '../ai/tools/set-agent.js';
import SetGoalTool from '../ai/tools/set-goal.js';
import useAgents from '../components/agents-provider/use-agents.js';
import useTools from '../components/tools-provider/use-tools.js';

const useReduxAgentToolkit = () => {
	const { agents, activeAgent, setActiveAgent } = useAgents();
	const { registerTool } = useTools();
	const { setAgentThought, setAgentGoal } = useDispatch( agentStore );
	const { goal, thought } = useSelect( ( select ) => ( {
		goal: select( agentStore ).getAgentGoal(),
		thought: select( agentStore ).getAgentThought(),
	} ) );

	// register the tools
	useEffect( () => {
		registerTool( {
			...SetGoalTool,
			callback: ( { goal: newGoal } ) => {
				setAgentGoal( newGoal );
				return `Goal set to "${ newGoal }"`;
			},
		} );
		registerTool( {
			...InformTool,
			callback: ( { message } ) => {
				setAgentThought( message );
				return message
					? `Agent thinks: "${ message }"`
					: 'Thought cleared';
			},
		} );
		registerTool( {
			...createSetAgentTool( agents ),
			callback: ( { agentId } ) => {
				setActiveAgent( agentId );
				return `Agent set to ${ agentId }`;
			},
		} );
	}, [
		agents,
		registerTool,
		setActiveAgent,
		setAgentGoal,
		setAgentThought,
	] );

	const context = useMemo( () => {
		return {
			agents,
			agent: {
				id: activeAgent?.id,
				assistantId: activeAgent?.assistantId,
				goal,
				thought,
			},
		};
	}, [ agents, activeAgent, goal, thought ] );

	const onReset = useCallback( () => {
		setAgentGoal( null );
		setAgentThought( null );
	}, [ setAgentGoal, setAgentThought ] );

	return {
		onReset,
		context,
	};
};

export default useReduxAgentToolkit;
