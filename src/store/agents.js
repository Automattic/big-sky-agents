import agents from '../agents/default-agents.js';
const DEFAULT_AGENT_NAME = 'Unknown Agent';

const initialState = {
	agentId: null,
	agentGoal: null,
	agentThought: null,
	enabled: true,
	agents,
};

function getAgent( state, agentId ) {
	return state.agents.find( ( agent ) => agent.id === agentId );
}

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
	setEnabled: ( enabled ) => {
		return {
			type: 'SET_AGENT_ENABLED',
			enabled,
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
		case 'SET_AGENT_ENABLED':
			return { ...state, enabled: action.enabled };
		default:
			return state;
	}
};

export const selectors = {
	getAgentId: ( state ) => {
		return state.agentId;
	},
	getAgentName: ( state ) => {
		return getAgent( state, state.agentId )?.name ?? DEFAULT_AGENT_NAME;
	},
	getAgent: ( state, agentId ) => {
		return getAgent( state, agentId );
	},
	getAgents: ( state ) => {
		return state.agents;
	},
	getAgentGoal: ( state ) => {
		return state.agentGoal;
	},
	getAgentThought: ( state ) => {
		return state.agentThought;
	},
	isEnabled: ( state ) => {
		return state.enabled;
	},
};
