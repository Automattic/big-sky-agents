import AskUserTool from '../tools/ask-user.js';
import { DotPromptTemplate } from '../prompt-template.js';
import InformUserTool from '../tools/inform-user.js';
import SetGoalTool from '../tools/set-goal.js';
import { SET_AGENT_TOOL_NAME } from '../tools/set-agent.js';
import AgentsToolkit from '../toolkits/agents-toolkit.js';
import AskUserToolkit from '../toolkits/ask-user-toolkit.js';
import InformUserToolkit from '../toolkits/inform-toolkit.js';
import GoalToolkit from '../toolkits/goal-toolkit.js';
import Agent from './agent.js';

const instructions = DotPromptTemplate.fromString(
	`You are a helpful assistant.`
);

const additionalInstructions = DotPromptTemplate.fromString(
	`Please attempt to complete the goal: {{= it.agent.goal }}.`,
	[ 'agent' ]
);

class BasicAgent extends Agent {
	get toolkits() {
		return [
			...super.toolkits,
			AgentsToolkit.name,
			AskUserToolkit.name,
			InformUserToolkit.name,
			GoalToolkit.name,
		];
	}

	onToolResult( toolName, value, callbacks, context ) {
		switch ( toolName ) {
			case AskUserTool.name:
				this.onAskUser( value, callbacks, context );
				break;
			case InformUserTool.name:
				this.onInformUser( value, callbacks, context );
				break;
			case SetGoalTool.name:
				this.onGoalChange( value, callbacks, context );
				break;
			case SET_AGENT_TOOL_NAME:
				this.onAgentChange( value, callbacks, context );
				break;
			default:
				super.onToolResult( toolName, value, callbacks, context );
		}
	}

	onGoalChange( goal ) {
		console.log( 'onGoalChange', goal );
	}

	onAskUser( value, callbacks, context ) {
		console.log( 'onAskUser', value, callbacks, context );
	}

	onInformUser( value, callbacks, context ) {
		console.log( 'onInformUser', value, callbacks, context );
	}

	onAgentChange( agentId ) {
		console.log( 'onAgentChange', agentId );
	}

	instructions( context ) {
		return instructions.format( context );
	}

	additionalInstructions( context ) {
		return additionalInstructions.format( context );
	}

	/**
	 * Tools
	 */

	tools( /* context */ ) {
		return [
			AskUserTool.name,
			InformUserTool.name,
			SetGoalTool.name,
			SET_AGENT_TOOL_NAME,
		];
	}

	/**
	 * Lifecycle methods
	 */

	onStart( { askUser } ) {
		askUser( {
			question: 'What can I help you with?',
		} );
	}
}

export default BasicAgent;
