import StandardAgent from './standard-agent.js';
import { JETPACK_STATS_AGENT_ID } from './default-agents.js';
import { FStringPromptTemplate } from './prompt-template.js';

const systemPrompt = FStringPromptTemplate.fromString(
	`You are a helpful SEO and web stats assistant. You are an expert in all things related to Jetpack Stats.`
);

class StatsAgent extends StandardAgent {
	getId() {
		return JETPACK_STATS_AGENT_ID;
	}

	getSystemPrompt() {
		return systemPrompt;
	}

	onStart() {
		this.askUser( {
			question: 'What are you looking to do today?',
			choices: [
				'I want to increase search engine traffic',
				'I want to understand my site stats',
			],
		} );
	}
}

export default StatsAgent;
