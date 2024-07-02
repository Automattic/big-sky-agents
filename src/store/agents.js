import { combineReducers, createReduxStore } from '@wordpress/data';
import { createNamespacedActions, createNamespacedSelectors } from './utils';

const DEFAULT_GOAL = "Find out the user's goal";

const initialState = {
	agents: [],
	activeAgentId: null,
	agentGoal: DEFAULT_GOAL,
	agentThought: null,
	started: false,
};

export const actions = {
	setAgentStarted: ( started ) => {
		return {
			type: 'SET_AGENT_STARTED',
			started,
		};
	},
	setActiveAgent: ( agentId ) => {
		return {
			type: 'SET_ACTIVE_AGENT',
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
	registerAgent: ( agent ) => {
		return {
			type: 'REGISTER_AGENT',
			agent,
		};
	},
};

export const reducer = ( state = initialState, action ) => {
	switch ( action.type ) {
		case 'REGISTER_AGENT':
			const { agent } = action;
			const existingAgentIndex = state.agents.findIndex(
				( a ) => a.id === agent.id
			);

			if ( existingAgentIndex !== -1 ) {
				const updatedAgents = [ ...state.agents ];
				updatedAgents[ existingAgentIndex ] = agent;
				return { ...state, agents: updatedAgents };
			}
			return { ...state, agents: [ ...state.agents, agent ] };
		case 'SET_ACTIVE_AGENT':
			return { ...state, activeAgentId: action.agentId };
		case 'SET_AGENT_GOAL':
			return { ...state, agentGoal: action.goal };
		case 'SET_AGENT_THOUGHT':
			return { ...state, agentThought: action.thought };
		case 'SET_AGENT_STARTED':
			return { ...state, started: action.started };
		default:
			return state;
	}
};

export const selectors = {
	getActiveAgentId: ( state ) => {
		return state.activeAgentId;
	},
	getActiveAgent: ( state ) => {
		return state.agents.find(
			( agent ) => agent.id === state.activeAgentId
		);
	},
	getActiveAgentName: ( state ) => {
		const activeAgent = selectors.getActiveAgent( state );
		return activeAgent?.name;
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
	isAgentStarted: ( state ) => state.started,
};

export function createAgentsStore( name, defaultValues ) {
	return createReduxStore( name, {
		reducer,
		actions,
		selectors,
		initialState: {
			...initialState,
			...defaultValues,
		},
	} );
}
