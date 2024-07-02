import Toolkit from './toolkit.js';
import AskUserTool from '../tools/ask-user.js';
import InformTool from '../tools/inform-user.js';
import SetGoalTool from '../tools/set-goal.js';
import createSetAgentTool, { SET_AGENT_TOOL_NAME } from '../tools/set-agent.js';
import { dispatch, select } from '@wordpress/data';

const INITIAL_STATE = {
	textColor: undefined,
	backgroundColor: undefined,
	accentColor: undefined,
	siteTitle: undefined,
	siteDescription: undefined,
	siteTopic: undefined,
	siteType: undefined,
	siteLocation: undefined,
	pages: [],
};

// class ReduxToolkit extends Toolkit {
// 	constructor( store ) {
// 		super( props, INITIAL_STATE );
// 		this.store = store;
// 	}

// }

class ReduxAgentsToolkit extends Toolkit {
	name = 'agents';

	constructor() {
		super( {}, INITIAL_STATE );
	}

	callbacks( store ) {
		return {
			[ InformTool.name ]: ( { message } ) => {
				dispatch( store ).setAgentThought( message );
				return message
					? `Agent thinks: "${ message }"`
					: 'Thought cleared';
			},
			[ SetGoalTool.name ]: ( { goal } ) => {
				dispatch( store ).setAgentGoal( goal );
				return `Goal set to "${ goal }"`;
			},
			[ SET_AGENT_TOOL_NAME ]: ( { agentId } ) => {
				dispatch( store ).setActiveAgent( agentId );
				return `Agent set to ${ agentId }`;
			},
		};
	}

	context( store ) {
		const selectors = select( store );
		const { agents, activeAgent, goal, thought } = {
			agents: selectors.getAgents(),
			activeAgent: selectors.getActiveAgent(),
			goal: selectors.getAgentGoal(),
			thought: selectors.getAgentThought(),
		};
		return {
			agents,
			agent: {
				id: activeAgent?.id,
				assistantId: activeAgent?.assistantId,
				goal,
				thought,
			},
		};
	}
}

export default ReduxAgentsToolkit;
