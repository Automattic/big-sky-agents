import AskUserTool from './tools/ask-user.js';
import { DotPromptTemplate } from './prompt-template.js';
import InformUserTool from './tools/inform-user.js';
import SetGoalTool from './tools/set-goal.js';
import createSetAgentTool from './tools/set-agent.js';

const instructions = DotPromptTemplate.fromString(
	`You are a helpful assistant.`
);

const additionalInstructions = DotPromptTemplate.fromString(
	`Please attempt to complete the goal: {{= it.agent.goal }}.`,
	[ 'agent' ]
);

class Agent {
	constructor( chat, toolkit ) {
		this.chat = chat;
		this.toolkit = toolkit;
	}

	getId() {
		throw new Error( 'Agent must implement getId' );
	}

	getAssistantId() {
		return 'Wapuu';
	}

	getInstructions() {
		return instructions;
	}

	getAdditionalInstructions() {
		return additionalInstructions;
	}

	/**
	 * Tools
	 */

	getTools( values ) {
		return [
			AskUserTool,
			InformUserTool,
			SetGoalTool,
			createSetAgentTool( values.agents ),
		];
	}

	findTools( ...toolNames ) {
		return this.toolkit.tools.filter( ( tool ) =>
			toolNames.includes( tool.function.name )
		);
	}

	/**
	 * Make it seem as if the user said something. Good for scripting behind-the-scenes workflows triggered by "Now build me a contact form", etc.
	 */

	userSay( message, file_urls = [] ) {
		this.chat.userSay( message, file_urls );
	}

	/**
	 * "Remote control" methods that make the Agent perform a given action
	 * e.g. agent.askUser( { question: 'What can I help you with?', choices: [ 'A task', 'A question' ] } )
	 */

	call( toolName, args, id ) {
		this.chat.call( toolName, args, id );
	}

	askUser( { question, choices } ) {
		this.call( AskUserTool.function.name, { question, choices } );
	}

	informUser( message ) {
		this.call( InformUserTool.function.name, { message } );
	}

	setGoal( goal ) {
		this.call( SetGoalTool.function.name, { goal } );
	}

	/**
	 * Lifecycle methods
	 */

	onStart() {
		this.askUser( {
			question: 'What can I help you with?',
		} );
	}
}

export default Agent;
