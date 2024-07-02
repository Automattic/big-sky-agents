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

	onStart( invoke ) {
		invoke.askUser( {
			question: 'What would you like to do?',
		} );
	}

	onConfirm( confirmed, invoke ) {
		if ( confirmed ) {
			invoke.setGoal( 'Find out what the user wants to do next' );
			invoke.informUser( 'Got it!' );
			invoke.askUser( {
				question: 'What would you like to do next?',
			} );
		} else {
			invoke.informUser( 'Looks like you requested some changes' );
			invoke.userSay( 'I would like to make some changes' );
			invoke.askUser( {
				question: 'What would you like to change?',
			} );
		}
	}
}

export default BuilderAgent;
