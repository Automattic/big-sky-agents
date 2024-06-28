export const initialState = {
	activeAgentId: null,
	agents: [],
};

export function agentsReducer( state, action ) {
	switch ( action.type ) {
		case 'REGISTER_AGENT':
			const { agent } = action.payload;
			const existingAgentIndex = state.agents.findIndex(
				( a ) => a.id === agent.id
			);

			if ( existingAgentIndex !== -1 ) {
				// If agent with the same ID already exists, replace it with the new agent
				const updatedAgents = [ ...state.agents ];
				updatedAgents[ existingAgentIndex ] = agent;
				return { ...state, agents: updatedAgents };
			}
			// If agent with the same ID doesn't exist, add the new agent to the array
			return { ...state, agents: [ ...state.agents, agent ] };
		case 'SET_ACTIVE_AGENT':
			return { ...state, activeAgentId: action.payload.agentId };
		default:
			return state;
	}
}
