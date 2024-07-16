import BasicAgent from './basic-agent.js';
import AnalyzeUrlTool from '../tools/analyze-url.js';
import { DotPromptTemplate } from '../prompt-template.js';
import { ANALYZE_SITE_TOOLKIT_ID } from '../../hooks/use-analyze-site-toolkit.js';

export const WAPUU_AGENT_ID = 'Wapuu';
export const WAPUU_ASSISTANT_ID = 'asst_lk7tPSgLWShOx6N0LJuxQGVe';

const defaultQuestion = 'What can I help you with?';

const defaultChoices = [
	// these more-or-less correspond to specific agents
	'I want to change my site title or settings',
];

const instructions = DotPromptTemplate.fromString(
	`You are a helpful AI assistant. Your mission is to find out what the user needs, clearly set goal and choose an appropriate agent to help them.`
);

class WapuuAgent extends BasicAgent {
	id = WAPUU_AGENT_ID;
	name = 'Wapuu';
	assistantId = WAPUU_ASSISTANT_ID;
	description =
		'Here to understand your goal and choose the best agent to help you.';

	get toolkits() {
		return [ ...super.toolkits, ANALYZE_SITE_TOOLKIT_ID ];
	}

	instructions( context ) {
		return instructions.format( context );
	}

	tools( context ) {
		return [ ...super.tools( context ), AnalyzeUrlTool.name ];
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

export default WapuuAgent;
