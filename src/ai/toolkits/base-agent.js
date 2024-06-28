import Toolkit from './toolkit.js';
import InformTool, { INFORM_TOOL_NAME } from '../tools/inform-user.js';
import AskUserTool from '../tools/ask-user.js';
import AnalyzeUrlTool from '../tools/analyze-url.js';
import createSetAgentTool, { SET_AGENT_TOOL_NAME } from '../tools/set-agent.js';
import SetGoalTool, { SET_AGENT_GOAL_TOOL_NAME } from '../tools/set-goal.js';

const INITIAL_STATE = {
	agentId: null,
	agentGoal: "Understand the user's goal",
	agentThought: null,
};

class SimpleAgentToolkit extends Toolkit {
	constructor( props ) {
		super( props, INITIAL_STATE );

		this.tools = this.tools();
	}

	getValues = () => {
		const { agents } = this.props;
		const { agentId, agentGoal, agentThought } = this.state;

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
				this.setState( { agentId: newAgentId } );
				return `Agent set to ${ newAgentId }`;
			},
			[ SET_AGENT_GOAL_TOOL_NAME ]: ( { goal } ) => {
				this.setState( { agentGoal: goal } );
				return `Goal set to "${ goal }"`;
			},
			[ INFORM_TOOL_NAME ]: ( { message } ) => {
				this.setState( { agentThought: message } );
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
		this.setState( {
			agentGoal: null,
			agentThought: null,
		} );
	};
}

export default SimpleAgentToolkit;
