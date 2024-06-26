import Toolkit from './toolkit.js';
import InformTool, { INFORM_TOOL_NAME } from '../tools/inform-user.js';
import AskUserTool from '../tools/ask-user.js';
import AnalyzeUrlTool from '../tools/analyze-url.js';
import createSetAgentTool, { SET_AGENT_TOOL_NAME } from '../tools/set-agent.js';
import SetGoalTool, { SET_AGENT_GOAL_TOOL_NAME } from '../tools/set-goal.js';

class SimpleAgentToolkit extends Toolkit {
	constructor( props, stateManager ) {
		super( props, stateManager );

		this.tools = this.getTools();
	}

	getValues = () => {
		const { agents } = this.props;
		const { agentId, agentGoal, agentThought } =
			this.stateManager.getState();

		return {
			agents,
			agent: {
				id: agentId,
				name: agents.find( ( agent ) => agent.id === agentId )?.name,
				goal: agentGoal,
				thought: agentThought,
			},
		};
	};

	getCallbacks = () => {
		return {
			[ SET_AGENT_TOOL_NAME ]: ( { agentId: newAgentId } ) => {
				const { agents } = this.props;
				// check that agents includes an element with agent.id == agentId
				// if not, return error message
				const agentConfig = agents.find(
					( agent ) => agent.id === newAgentId
				);
				if ( ! agentConfig ) {
					return `Agent ${ newAgentId } not found`;
				}

				const newState = { agentId: newAgentId };
				if ( agentConfig.assistantId ) {
					// set assistantId in store
					newState.assistantId = agentConfig.assistantId;
				}
				this.stateManager.setState( newState );

				// if values.agents includes this agent
				return `Agent set to ${ newAgentId }`;
			},
			[ SET_AGENT_GOAL_TOOL_NAME ]: ( { goal } ) => {
				this.stateManager.setState( { agentGoal: goal } );
				return `Goal set to "${ goal }"`;
			},
			[ INFORM_TOOL_NAME ]: ( { message } ) => {
				this.stateManager.setState( { agentThought: message } );
				return message
					? `Agent thinks: "${ message }"`
					: 'Thought cleared';
			},
		};
	};

	getTools = () => {
		const { agents } = this.props;

		return [
			createSetAgentTool( agents ),
			InformTool,
			AskUserTool,
			SetGoalTool,
			AnalyzeUrlTool,
		];
	};

	onReset = () => {
		this.stateManager.resetState();
	};
}

export default SimpleAgentToolkit;
