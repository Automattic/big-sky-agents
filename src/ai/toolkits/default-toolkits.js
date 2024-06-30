// pass in a registry object with a registerAgent function
export default ( { registerToolkit }, agentRegistry ) => {
	registerToolkit( 'agent', {
		values: () => {

			return {
				agents: agentRegistry.getAgents(),
				agent: {
					assistantId: agentRegistry.getAssistantId(),
					id: agentRegistry.getAgentId(),
					name: agentRegistry.getAgentName(),
					goal: agentRegistry.getAgentGoal(),
					thought: agentRegistry.getAgentThought(),
				},
			};
		}
	} );
};


const { setAgentThought, setAgentGoal, setAgent, setAssistantId } =
		useDispatch( agentStore );

	// these are fed to the templating engine on each render of the system/after-call prompt
	const values = useSelect(
		( select ) => ( {
			agents: select( agentStore ).getAgents(),
			agent: {
				assistantId: select( agentStore ).getAssistantId(),
				id: select( agentStore ).getAgentId(),
				name: select( agentStore ).getAgentName(),
				goal: select( agentStore ).getAgentGoal(),
				thought: select( agentStore ).getAgentThought(),
			},
		} ),
		[]
	);

	const callbacks = useMemo( () => {
		return {
			[ SET_AGENT_TOOL_NAME ]: ( { agentId } ) => {
				// check that values.agents includes an element with agent.id == agentId
				// if not, return error message
				const agentConfig = values.agents.find(
					( agent ) => agent.id === agentId
				);
				if ( ! agentConfig ) {
					return `Agent ${ agentId } not found`;
				}
				setAgent( agentId );

				if ( agentConfig.assistantId ) {
					// set assistantId in store
					setAssistantId( agentConfig.assistantId );
				}

				// if values.agents includes this agent
				return `Agent set to ${ agentId }`;
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
	}, [
		setAgent,
		setAgentGoal,
		setAgentThought,
		setAssistantId,
		values.agents,
	] );

	const tools = useMemo( () => {
		return [ createSetAgentTool( values.agents ), SetGoalTool, InformTool ];
	}, [ values.agents ] );

	const onReset = useCallback( () => {
		setAgentGoal( null );
		setAgentThought( null );
	}, [ setAgentGoal, setAgentThought ] );

	return {
		onReset,
		tools,
		values,
		callbacks,
	};