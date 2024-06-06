import { ASK_USER_TOOL_NAME } from './tools/ask-user.js';
import { FStringPromptTemplate } from './prompt-template.js';

const systemPrompt = FStringPromptTemplate.fromString(
	`You are a helpful assistant.`
);

const nextStepPrompt = FStringPromptTemplate.fromString(
	`Please attempt to complete the goal: {agent.goal}.`
);

class Agent {
	constructor( chat, toolkit ) {
		this.chat = chat;
		this.toolkit = toolkit;
	}

	getId() {
		throw new Error( 'Agent must implement getId' );
	}

	call( toolName, ...args ) {
		this.chat.call( toolName, ...args );
	}

	userSay( message, file_urls = [] ) {
		this.chat.userSay( message, file_urls );
	}

	getTools( /* values */ ) {
		return [];
	}

	findTools( ...toolNames ) {
		return this.toolkit.tools.filter( ( tool ) =>
			toolNames.includes( tool.function.name )
		);
	}

	getSystemPrompt() {
		return systemPrompt;
	}

	getNextStepPrompt() {
		return nextStepPrompt;
	}

	onStart() {
		this.chat.call( ASK_USER_TOOL_NAME, {
			question: 'What can I help you with?',
			choices: [ 'A task', 'A question' ],
		} );
	}
}

export default Agent;
