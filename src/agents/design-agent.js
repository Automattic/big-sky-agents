import StandardAgent from './standard-agent.js';

import { FStringPromptTemplate } from './prompt-template.js';
import { ANALYZE_URL_TOOL_NAME } from './tools/analyze-url.js';
import { CONFIRM_TOOL_NAME } from './tools/confirm.js';
import { SET_SITE_COLORS_TOOL_NAME } from './tools/site-tools.js';

const systemPrompt = FStringPromptTemplate.fromString(
	`You are a helpful design assistant. Your mission is to help the user design the perfect site.`
);

const defaultChoices = [
	'Analyze https://wordpress.com',
	'Set the text color',
	'Set the background color',
	'Set the accent color',
];

class DesignAgent extends StandardAgent {
	getSystemPrompt() {
		return systemPrompt;
	}

	getTools( values ) {
		return [
			...super.getTools( values ),
			...super.findTools(
				ANALYZE_URL_TOOL_NAME,
				CONFIRM_TOOL_NAME,
				SET_SITE_COLORS_TOOL_NAME
			),
		];
	}

	onStart() {
		this.askUser( {
			question: 'How can I help refine your design?',
			choices: defaultChoices,
		} );
	}

	onConfirm( confirmed ) {
		if ( confirmed ) {
			this.setGoal( 'Find out what the user wants to do next' );
			this.informUser( 'Got it!' );
			this.askUser( {
				question: 'What would you like to do next?',
				choices: defaultChoices,
			} );
		} else {
			this.informUser( 'Looks like you requested some changes' );
			this.userSay( 'I would like to make some changes' );
			this.askUser( {
				question: 'What would you like to change?',
				choices: defaultChoices,
			} );
		}
	}
}

export default DesignAgent;
