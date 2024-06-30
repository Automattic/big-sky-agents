import Agent from './agent.js';
import { DotPromptTemplate } from '../prompt-template.js';

const instructions = DotPromptTemplate.fromString(
	`You are a helpful WordPress tutor. You are an expert in all things WordPress.`
);

class TutorAgent extends Agent {
	id = 'WPTutor';
	name = 'WordPress Tutor';
	description = 'Here to help you learn WordPress.';

	instructions( context ) {
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
