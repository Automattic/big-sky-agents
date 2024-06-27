import { ASK_USER_TOOL_NAME } from './tools/ask-user.js';
import Agent from './agent.js';
import { WORDPRESS_TUTOR_AGENT_ID } from './agents/default-agents.js';
import { DotPromptTemplate } from './prompt-template.js';

const instructions = DotPromptTemplate.fromString(
	`You are a helpful WordPress tutor. You are an expert in all things WordPress.`
);

class TutorAgent extends Agent {
	getId() {
		return WORDPRESS_TUTOR_AGENT_ID;
	}

	getInstructions() {
		return instructions.format( this.toolkit.values );
	}

	onStart() {
		this.toolkit.call( ASK_USER_TOOL_NAME, {
			question: 'What can I help you with?',
			choices: [
				'How do I add a page?',
				'What are some good resources for learning WordPress?',
			],
		} );
	}
}

export default TutorAgent;
