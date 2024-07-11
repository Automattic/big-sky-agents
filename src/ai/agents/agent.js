/**
 * Internal dependencies
 */
import log from '../../utils/log-debug.js';

import AskUserTool from '../tools/ask-user.js';
import { DotPromptTemplate } from '../prompt-template.js';
import InformUserTool from '../tools/inform-user.js';
import SetGoalTool from '../tools/set-goal.js';
import { SET_AGENT_TOOL_NAME } from '../tools/set-agent.js';
import { AGENTS_TOOLKIT_ID } from '../../hooks/use-agent-toolkit.js';

const instructions = DotPromptTemplate.fromString(
	`You are a helpful assistant.`
);

const additionalInstructions = DotPromptTemplate.fromString(
	`Please attempt to complete the goal: {{= it.agent.goal }}.`,
	[ 'agent' ]
);

class Agent {
	toolkits = [ AGENTS_TOOLKIT_ID ];

	get id() {
		throw new Error( `Agent ${ this.id } must implement id` );
	}

	get name() {
		throw new Error( `Agent ${ this.id } must implement name` );
	}

	get description() {
		throw new Error( `Agent ${ this.id } must implement description` );
	}

	onToolResult( toolName, value, toolResponse, context ) {
		// do nothing by default
		log.info( 'onToolResult', {
			toolName,
			value,
			toolResponse,
			context,
		} );
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
