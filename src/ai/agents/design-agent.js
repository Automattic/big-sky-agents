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
	id = 'WPDesign';
	name = 'Design Assistant';
	description = 'Here to help you design the perfect site.';

	instructions( context ) {
		return instructions.format( context );
	}

	tools( context ) {
		return [ ...super.tools( context ), SetSiteColorsTool ];
	}

	onStart( { askUser } ) {
		askUser( {
			question: 'How can I help refine your design?',
			choices: defaultChoices,
		} );
	}

	onConfirm( confirmed, { setGoal, informUser, askUser, userSay } ) {
		if ( confirmed ) {
			setGoal( 'Find out what the user wants to do next' );
			informUser( 'Got it!' );
			askUser( {
				question: 'What would you like to do next?',
				choices: defaultChoices,
			} );
		} else {
			informUser( 'Looks like you requested some changes' );
			userSay( 'I would like to make some changes' );
			askUser( {
				question: 'What would you like to change?',
				choices: defaultChoices,
			} );
		}
	}
}

export default DesignAgent;
