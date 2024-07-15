/**
 * Internal dependencies
 */
import log from '../../utils/log-debug.js';
import { DotPromptTemplate } from '../prompt-template.js';

const instructions = DotPromptTemplate.fromString(
	`You are a helpful assistant.`
);

class Agent {
	get toolkits() {
		return [];
	}

	get id() {
		throw new Error( `Agent ${ this.id } must implement id` );
	}

	get name() {
		throw new Error( `Agent ${ this.id } must implement name` );
	}

	get description() {
		throw new Error( `Agent ${ this.id } must implement description` );
	}

	onToolResult( toolName, value, callbacks, context ) {
		// do nothing by default
		log.info( 'onToolResult', {
			toolName,
			value,
			callbacks,
			context,
		} );
	}

	instructions( context ) {
		return instructions.format( context );
	}

	additionalInstructions() {
		return null;
	}

	/**
	 * Tools
	 */

	tools() {
		return [];
	}

	/**
	 * Lifecycle methods
	 */

	onStart( { askUser } ) {
		askUser( {
			question: 'What can I help you with?',
		} );
	}
}

export default Agent;
