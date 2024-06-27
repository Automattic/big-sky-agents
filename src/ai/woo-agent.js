import Agent from './agent.js';
import AnalyzeUrlTool from './tools/analyze-url.js';
import { WOO_STORE_AGENT_ID } from './agents/default-agents.js';
import { DotPromptTemplate } from './prompt-template.js';

const instructions = DotPromptTemplate.fromString(
	`You are a helpful eCommerce assistant. You are an expert in all things WooCommerce.`
);

class WooAgent extends Agent {
	getId() {
		return WOO_STORE_AGENT_ID;
	}

	getInstructions() {
		return instructions.format( this.toolkit.values );
	}

	getTools() {
		return [ ...super.getTools(), AnalyzeUrlTool ];
	}

	onStart() {
		this.askUser( {
			question: 'What are you looking to do with Woo?',
			choices: [ 'I want to add a product', 'I want to edit a product' ],
		} );
	}
}

export default WooAgent;
