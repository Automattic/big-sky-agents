import { createReduxStore, createSelector } from '@wordpress/data';

const initialState = {
	agents: [],
	activeAgentId: null,
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
		case 'SET_AGENT_STARTED':
			return { ...state, started: action.started };
		default:
			return state;
	}
};

export const selectors = {
	getActiveAgentId: ( state ) => state.activeAgentId,
	getAgents: ( state ) => state.agents,
	isAgentStarted: ( state ) => state.started,

	getActiveAgent: createSelector(
		( state ) =>
			state.agents.find( ( agent ) => agent.id === state.activeAgentId ),
		( state ) => [ state.agents, state.activeAgentId ]
	),

	getActiveAgentName: createSelector(
		( state ) => selectors.getActiveAgent( state )?.name,
		( state ) => [ state.agents, state.activeAgentId ]
	),
};

export const slice = {
	reducer,
	actions,
	selectors,
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
