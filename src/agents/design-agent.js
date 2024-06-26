import BuilderAgent from './builder-agent.js';
import { DotPromptTemplate } from './prompt-template.js';
import { SetSiteColorsTool } from './tools/site-tools.js';

const instructions = DotPromptTemplate.fromString(
	`You are a helpful design assistant. Your mission is to help the user design the perfect site.`
);

const defaultChoices = [
	'Analyze https://wordpress.com',
	'Set the text color',
	'Set the background color',
	'Set the accent color',
	'What else can you do?',
];

class DesignAgent extends BuilderAgent {
	getInstructions() {
		return instructions.format( this.toolkit.values );
	}

	getTools() {
		return [ ...super.getTools(), SetSiteColorsTool ];
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
