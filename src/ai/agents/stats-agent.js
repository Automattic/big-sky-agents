import Agent from './agent.js';
import { JETPACK_STATS_AGENT_ID } from './default-agents.js';
import { DotPromptTemplate } from '../prompt-template.js';

const instructions = DotPromptTemplate.fromString(
	`You are a helpful SEO and web stats assistant. You are an expert in all things related to Jetpack Stats.`
);

class StatsAgent extends Agent {
	getId() {
		return JETPACK_STATS_AGENT_ID;
	}

	getInstructions() {
		return instructions.format( this.toolkit.values );
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
