import { ASK_USER_TOOL_NAME } from './tools/ask-user.js';
import StandardAgent from './standard-agent.js';
import { WORDPRESS_TUTOR_AGENT_ID } from './default-agents.js';
import { FStringPromptTemplate } from './prompt-template.js';

const systemPrompt = FStringPromptTemplate.fromString(
	`You are a helpful WordPress tutor. You are an expert in all things WordPress.`
);

class TutorAgent extends StandardAgent {
	getId() {
		return WORDPRESS_TUTOR_AGENT_ID;
	}

	getSystemPrompt() {
		return systemPrompt;
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
