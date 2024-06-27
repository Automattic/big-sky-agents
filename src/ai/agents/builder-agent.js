import Agent from './agent.js';
import { DotPromptTemplate } from '../prompt-template.js';
import AnalyzeUrlTool from '../tools/analyze-url.js';
import ConfirmTool from '../tools/confirm.js';

const instructions = DotPromptTemplate.fromString(
	`You are a helpful assistant. Your mission is to help the user design the perfect site.`
);

class BuilderAgent extends Agent {
	getInstructions() {
		return instructions.format( this.toolkit.values );
	}

	getTools() {
		return [ ...super.getTools(), AnalyzeUrlTool, ConfirmTool ];
	}

	onStart() {
		this.askUser( {
			question: 'What would you like to do?',
		} );
	}

	analyzeUrl( { url } ) {
		this.call( AnalyzeUrlTool.function.name, { url } );
	}

	confirm( { message } ) {
		this.call( ConfirmTool.function.name, { message } );
	}

	onConfirm( confirmed ) {
		if ( confirmed ) {
			this.setGoal( 'Find out what the user wants to do next' );
			this.informUser( 'Got it!' );
			this.askUser( {
				question: 'What would you like to do next?',
			} );
		} else {
			this.informUser( 'Looks like you requested some changes' );
			this.userSay( 'I would like to make some changes' );
			this.askUser( {
				question: 'What would you like to change?',
			} );
		}
	}
}

export default BuilderAgent;
