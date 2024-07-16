import BasicAgent from '../basic-agent.js';
import { DotPromptTemplate } from '../../prompt-template.js';

export const WAPUU_AGENT_ID = 'Wapuu';

const defaultQuestion = 'What can I help you with?';

const defaultChoices = [
	// these more-or-less correspond to specific agents
	'I want to change my site title or settings',
];

const instructions = DotPromptTemplate.fromString(
	`You are a helpful AI assistant. Your mission is to find out what the user needs, clearly set goal and choose an appropriate agent to help them.`
);

class WapuuCLIAgent extends BasicAgent {
	id = WAPUU_AGENT_ID;
	name = 'Wapuu';
	description =
		'Here to understand your goal and choose the best agent to help you.';

	get toolkits() {
		return super.toolkits;
	}

	instructions( context ) {
		return instructions.format( context );
	}

	tools( context ) {
		return [ ...super.tools( context ) ];
	}

	getDefaultQuestion() {
		return defaultQuestion;
	}

	getDefaultChoices() {
		return defaultChoices;
	}

	onStart( invoke ) {
		invoke.askUser( {
			question: defaultQuestion,
			choices: defaultChoices,
		} );
	}
}

export default WapuuCLIAgent;
