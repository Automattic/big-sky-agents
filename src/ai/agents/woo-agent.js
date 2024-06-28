import Agent from './agent.js';
import AnalyzeUrlTool from '../tools/analyze-url.js';
import { DotPromptTemplate } from '../prompt-template.js';

const instructions = DotPromptTemplate.fromString(
	`You are a helpful eCommerce assistant. You are an expert in all things WooCommerce.`
);

class WooAgent extends Agent {
	id = 'WooStore';

	instructions( context ) {
		return instructions.format( context );
	}

	tools( context ) {
		return [ ...super.tools( context ), AnalyzeUrlTool ];
	}

	onStart( toolkit ) {
		toolkit.askUser( {
			question: 'What are you looking to do with Woo?',
			choices: [ 'I want to add a product', 'I want to edit a product' ],
		} );
	}
}

export default WooAgent;
