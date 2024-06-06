import StandardAgent from './standard-agent.js';
import AnalyzeUrlTool from './tools/analyze-url.js';
import { WOO_STORE_AGENT_ID } from './default-agents.js';
import { FStringPromptTemplate } from './prompt-template.js';

const systemPrompt = FStringPromptTemplate.fromString(
	`You are a helpful eCommerce assistant. You are an expert in all things WooCommerce.`
);

class WooAgent extends StandardAgent {
	getId() {
		return WOO_STORE_AGENT_ID;
	}

	getSystemPrompt() {
		return systemPrompt;
	}

	getTools( values ) {
		return [ ...super.getTools( values ), AnalyzeUrlTool ];
	}

	onStart() {
		this.askUser( {
			question: 'What are you looking to do with Woo?',
			choices: [ 'I want to add a product', 'I want to edit a product' ],
		} );
	}
}

export default WooAgent;
