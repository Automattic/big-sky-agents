import StandardAgent from './standard-agent.js';
import { ANALYZE_URL_TOOL_NAME } from './tools/analyze-url.js';
import { WAPUU_AGENT_ID } from './default-agents.js';
import { FStringPromptTemplate } from './prompt-template.js';

const systemPrompt = FStringPromptTemplate.fromString(
	`You are a helpful AI assistant. Your mission is to find out what the user needs, clearly set goal and choose an appropriate agent to help them.`
);

class WapuuAgent extends StandardAgent {
	getId() {
		return WAPUU_AGENT_ID;
	}

	getSystemPrompt() {
		return systemPrompt;
	}

	getTools( values ) {
		return [
			...super.getTools( values ),
			...this.findTools( ANALYZE_URL_TOOL_NAME ),
		];
	}

	onStart() {
		this.askUser( {
			question: 'What can I help you with?',
			choices: [
				// these more-or-less correspond to specific agents
				'Help me finish my site',
				'Copy fonts, colors, content or layout from another site',
				'I want to change my site title or settings',
				'I want to add, edit or remove pages',
				'I want to change the color or fonts of my site',
				'I want to learn about WordPress',
				'I want to understand my stats',
				'I want to build or modify a store',
			],
		} );
	}
}

export default WapuuAgent;
