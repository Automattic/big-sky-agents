import Agent from './agent.js';
import { DotPromptTemplate } from '../prompt-template.js';
import AnalyzeUrlTool from '../tools/analyze-url.js';
import ConfirmTool from '../tools/confirm.js';

const instructions = DotPromptTemplate.fromString(
	`You are a helpful assistant. Your mission is to help the user design the perfect site.`
);

class BuilderAgent extends Agent {
	instructions( context ) {
		return instructions.format( context );
	}

	tools( context ) {
		return [ ...super.tools( context ), AnalyzeUrlTool, ConfirmTool ];
	}

	onStart( toolkit ) {
		toolkit.askUser( {
			question: 'What would you like to do?',
		} );
	}

	onConfirm( confirmed, toolkit ) {
		if ( confirmed ) {
			toolkit.setGoal( 'Find out what the user wants to do next' );
			toolkit.informUser( 'Got it!' );
			toolkit.askUser( {
				question: 'What would you like to do next?',
			} );
		} else {
			toolkit.informUser( 'Looks like you requested some changes' );
			toolkit.userSay( 'I would like to make some changes' );
			toolkit.askUser( {
				question: 'What would you like to change?',
			} );
		}
	}
}

export default BuilderAgent;
