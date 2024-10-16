import BasicAgent from './basic-agent.js';
import { DotPromptTemplate } from '../prompt-template.js';

const instructions = DotPromptTemplate.fromString(
	`You are a helpful SEO and web stats assistant. You are an expert in all things related to Jetpack Stats.`
);

class StatsAgent extends BasicAgent {
	id = 'JetpackStats';
	name = 'Jetpack Stats';
	description = 'Here to help you understand your site stats.';

	instructions( context ) {
		return instructions.format( context );
	}

	onStart( { askUser } ) {
		askUser( {
			question: 'What are you looking to do today?',
			choices: [
				'I want to increase search engine traffic',
				'I want to understand my site stats',
			],
		} );
	}
}

export default StatsAgent;
