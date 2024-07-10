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

	onStart( { askUser } ) {
		askUser( {
			question: 'What would you like to do?',
		} );
	}

	// by overriding this method you can handle almost any kind of lifecycle callback
	onToolResult( toolName, value, callbacks ) {
		switch ( toolName ) {
			case ConfirmTool.name:
				this.onConfirm( value, callbacks );
				break;
			default:
				super.onToolResult( toolName, value, callbacks );
		}
	}

	onConfirm( confirmed, { setGoal, informUser, askUser, userSay } ) {
		if ( confirmed ) {
			setGoal( { goal: 'Find out what the user wants to do next' } );
			informUser( { message: 'Got it!' } );
			askUser( {
				question: 'What would you like to do next?',
			} );
		} else {
			informUser( { message: 'Looks like you requested some changes' } );
			userSay( 'I would like to make some changes' );
			askUser( {
				question: 'What would you like to change?',
			} );
		}
	}
}

export default BuilderAgent;
