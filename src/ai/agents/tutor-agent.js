import Agent from './agent.js';
import { WORDPRESS_TUTOR_AGENT_ID } from './default-agents.js';
import { DotPromptTemplate } from '../prompt-template.js';

const instructions = DotPromptTemplate.fromString(
	`You are a helpful WordPress tutor. You are an expert in all things WordPress.`
);

class TutorAgent extends Agent {
	getId() {
		return WORDPRESS_TUTOR_AGENT_ID;
	}

	getInstructions( context ) {
		return instructions.format( context );
	}

	onStart( toolkit ) {
		toolkit.askUser( {
			question: 'What can I help you with?',
			choices: [
				'How do I add a page?',
				'What are some good resources for learning WordPress?',
			],
		} );
	}
}

export default TutorAgent;
