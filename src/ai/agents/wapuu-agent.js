import Agent from './agent.js';
import AnalyzeUrlTool from '../tools/analyze-url.js';
import { WAPUU_AGENT_ID, WAPUU_ASSISTANT_ID } from './default-agents.js';
import { DotPromptTemplate } from '../prompt-template.js';

const defaultQuestion = 'What can I help you with?';

const defaultChoices = [
	// these more-or-less correspond to specific agents
	'Help me finish my site',
	'Copy fonts, colors, content or layout from another site',
	'I want to change my site title or settings',
	'I want to add, edit or remove pages',
	'I want to change the color or fonts of my site',
	'I want to learn about WordPress',
	'I want to understand my stats',
	'I want to build or modify a store',
];

const instructions = DotPromptTemplate.fromString(
	`You are a helpful AI assistant. Your mission is to find out what the user needs, clearly set goal and choose an appropriate agent to help them.`
);

class WapuuAgent extends Agent {
	id = WAPUU_AGENT_ID;
	assistantId = WAPUU_ASSISTANT_ID;
	description =
		'Here to understand your goal and choose the best agent to help you.';

	getInstructions( context ) {
		return instructions.format( context );
	}

	getTools( context ) {
		return [ ...super.getTools( context ), AnalyzeUrlTool ];
	}

	getDefaultQuestion() {
		return defaultQuestion;
	}

	getDefaultChoices() {
		return defaultChoices;
	}

	onStart( toolkit ) {
		toolkit.askUser( {
			question: defaultQuestion,
			choices: defaultChoices,
		} );
	}
}

export default WapuuAgent;
