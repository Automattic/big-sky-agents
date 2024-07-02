import AskUserTool from '../tools/ask-user.js';
import { DotPromptTemplate } from '../prompt-template.js';
import InformUserTool from '../tools/inform-user.js';
import SetGoalTool from '../tools/set-goal.js';
import { SET_AGENT_TOOL_NAME } from '../tools/set-agent.js';

const instructions = DotPromptTemplate.fromString(
	`You are a helpful assistant.`
);

const additionalInstructions = DotPromptTemplate.fromString(
	`Please attempt to complete the goal: {{= it.agent.goal }}.`,
	[ 'agent' ]
);

const STANDARD_TOOLKIT = 'agents';

class Agent {
	toolkits = [ STANDARD_TOOLKIT ];

	get id() {
		throw new Error( 'Agent must implement id' );
	}

	get name() {
		throw new Error( 'Agent must implement name' );
	}

	get description() {
		throw new Error( 'Agent must implement description' );
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

export default Agent;