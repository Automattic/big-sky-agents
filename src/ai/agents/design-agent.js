import BuilderAgent from './builder-agent.js';
import { DotPromptTemplate } from '../prompt-template.js';
import { SetSiteColorsTool } from '../tools/site-tools.js';

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
	getId() {
		return 'WPDesign';
	}

	getInstructions( context ) {
		return instructions.format( context );
	}

	getTools( context ) {
		return [ ...super.getTools( context ), SetSiteColorsTool ];
	}

	onStart( toolkit ) {
		toolkit.askUser( {
			question: 'How can I help refine your design?',
			choices: defaultChoices,
		} );
	}

	onConfirm( confirmed, toolkit ) {
		if ( confirmed ) {
			toolkit.setGoal( 'Find out what the user wants to do next' );
			toolkit.informUser( 'Got it!' );
			toolkit.askUser( {
				question: 'What would you like to do next?',
				choices: defaultChoices,
			} );
		} else {
			toolkit.informUser( 'Looks like you requested some changes' );
			toolkit.userSay( 'I would like to make some changes' );
			toolkit.askUser( {
				question: 'What would you like to change?',
				choices: defaultChoices,
			} );
		}
	}
}

export default DesignAgent;
