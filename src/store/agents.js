const DEFAULT_GOAL = "Find out the user's goal";

const initialState = {
	agentId: null,
	agentGoal: DEFAULT_GOAL,
	agentThought: null,
};

export const actions = {
	setAgent: ( agentId ) => {
		return {
			type: 'SET_AGENT',
			agentId,
		};
	},
	setAgentGoal: ( goal ) => {
		return {
			type: 'SET_AGENT_GOAL',
			goal,
		};
	},
	setAgentThought: ( thought ) => {
		return {
			type: 'SET_AGENT_THOUGHT',
			thought,
		};
	},
};

export const reducer = ( state = initialState, action ) => {
	switch ( action.type ) {
		case 'SET_AGENT':
			return { ...state, agentId: action.agentId };
		case 'SET_AGENT_GOAL':
			return { ...state, agentGoal: action.goal };
		case 'SET_AGENT_THOUGHT':
			return { ...state, agentThought: action.thought };
		default:
			return state;
	}
};

export const selectors = {
	getAgentId: ( state ) => {
		return state.agentId;
	},
	getAgentGoal: ( state ) => {
		return state.agentGoal;
	},
	getAgentThought: ( state ) => {
		return state.agentThought;
	},
};
