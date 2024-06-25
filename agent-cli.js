import dotenv from 'dotenv';
import ChatModel, {
	ChatModelService,
	ChatModelType,
} from './src/agents/chat-model.js';
import SimpleAgentToolkit from './src/agents/toolkits/simple-agent.js';
import SimpleSiteToolkit from './src/agents/toolkits/simple-site.js';
import CombinedToolkit from './src/agents/toolkits/combined.js';
import promptSync from 'prompt-sync';
import AssistantModel from './src/agents/assistant-model.js';

import WapuuAgent from './src/agents/wapuu-agent.js';
import TutorAgent from './src/agents/tutor-agent.js';
import DesignAgent from './src/agents/design-agent.js';
import SiteSpecAgent from './src/agents/site-spec-agent.js';
import PageSpecAgent from './src/agents/page-spec-agent.js';
import WooAgent from './src/agents/woo-agent.js';
import StatsAgent from './src/agents/stats-agent.js';
import agents, {
	JETPACK_STATS_AGENT_ID,
	WAPUU_AGENT_ID,
	WOO_STORE_AGENT_ID,
	WORDPRESS_DESIGN_AGENT_ID,
	WORDPRESS_PAGE_SPEC_AGENT_ID,
	WORDPRESS_SITE_SPEC_AGENT_ID,
	WORDPRESS_TUTOR_AGENT_ID,
} from './src/agents/default-agents.js';
import { ASK_USER_TOOL_NAME } from './src/agents/tools/ask-user.js';

dotenv.config();

class CLIChat {
	constructor() {
		this.assistantMessage = '';
		this.prompt = promptSync();
		this.model = ChatModel.getInstance(
			ChatModelService.OPENAI,
			process.env.OPENAI_API_KEY
		);
		this.assistantModel = AssistantModel.getInstance(
			ChatModelService.OPENAI,
			process.env.OPENAI_API
		);
		this.messages = [];
		this.agent = null;
	}

	setAgent( agent ) {
		this.agent = agent;
		// this.agent.onStart();
	}

	findTools( ...toolNames ) {
		return this.tools.filter( ( tool ) =>
			toolNames.includes( tool.function.name )
		);
	}

	setToolResult( toolId, result ) {
		this.messages.push( {
			role: 'tool',
			tool_call_id: toolId,
			content: result,
		} );
	}

	async runCompletion() {
		const callbacks = this.agent.toolkit.getCallbacks();
		const values = this.agent.toolkit.getValues();
		const request = {
			model: ChatModelType.GPT_4O,
			messages: this.messages,
			tools: this.agent.getTools( values ),
			instructions: this.agent.getInstructions().format( values ),
			additionalInstructions: this.agent
				.getAdditionalInstructions()
				.format( values ),
			temperature: 0,
		};
		console.log( '🧠 Request:', request );
		const result = await this.model.run( request );
		console.log( '🧠 Result:', result, result.tool_calls?.[ 0 ].function );
		this.messages.push( result );

		if ( result.tool_calls ) {
			// use the first tool call for now
			const tool_call = result.tool_calls[ 0 ];

			// parse arguments if they're a string
			const resultArgs =
				typeof tool_call.function.arguments === 'string'
					? JSON.parse( tool_call.function.arguments )
					: tool_call.function.arguments;

			// see: https://community.openai.com/t/model-tries-to-call-unknown-function-multi-tool-use-parallel/490653/7
			if ( tool_call.function.name === 'multi_tool_use.parallel' ) {
				/**
				 * Looks like this:
				 * multi_tool_use.parallel({"tool_uses":[{"recipient_name":"WPSiteSpec","parameters":{"title":"Lorem Ipsum","description":"Lorem ipsum dolor sit amet, consectetur adipiscing elit.","type":"Blog","topic":"Lorem Ipsum","location":"Lorem Ipsum"}}]})
				 *
				 * I assume the result is supposed to be an array...
				 */
				// create an array of promises for the tool uses
				const promises = resultArgs.tool_uses.map( ( tool_use ) => {
					const callback = callbacks[ tool_use.recipient_name ];

					if ( typeof callback === 'function' ) {
						console.warn(
							'🧠 Parallel tool callback',
							tool_use.recipient_name
						);
						return callback( tool_use.parameters );
					}
					return `Unknown tool ${ tool_use.recipient_name }`;
				} );

				this.setToolResult(
					tool_call.id,
					await Promise.all( promises )
				);
			}

			const callback = callbacks[ tool_call.function.name ];

			if ( typeof callback === 'function' ) {
				console.warn(
					'🧠 Tool callback',
					tool_call.function.name,
					resultArgs
				);
				this.setToolResult(
					tool_call.id,
					await callback( resultArgs )
				);
				const agentId = this.agent.toolkit.getValues().agent.id;
				if ( agentId && agentId !== this.agent.getId() ) {
					console.log( `switching to new agent ${ agentId }` );
					switch ( agentId ) {
						// case WAPUU_AGENT_ID:
						// 	return new WapuuAgent( chat, toolkit );
						// case WORDPRESS_TUTOR_AGENT_ID:
						// 	return new TutorAgent( chat, toolkit );
						// case WORDPRESS_DESIGN_AGENT_ID:
						// 	return new DesignAgent( chat, toolkit );
						case WORDPRESS_SITE_SPEC_AGENT_ID:
							const simpleSiteToolkit = new SimpleSiteToolkit();
							const combinedToolkit = new CombinedToolkit( {
								toolkits: [
									simpleSiteToolkit,
									this.agent.toolkit,
								],
							} );
							this.setAgent(
								new SiteSpecAgent( this, combinedToolkit )
							);
							break;
						// case WORDPRESS_PAGE_SPEC_AGENT_ID:
						// 	return new PageSpecAgent( chat, toolkit );
						// case WOO_STORE_AGENT_ID:
						// 	return new WooAgent( chat, toolkit );
						// case JETPACK_STATS_AGENT_ID:
						// 	return new StatsAgent( chat, toolkit );
						default:
							this.setAgent(
								new WapuuAgent( this, this.agent.toolkit )
							);
					}
				} else {
					await this.runCompletion();
				}
			} else {
				switch ( tool_call.function.name ) {
					case ASK_USER_TOOL_NAME:
						this.assistantMessage = resultArgs.question;
						this.setToolResult( tool_call.id, resultArgs.question );
						break;
					default:
						console.error(
							'Unknown tool callback',
							tool_call.function.name,
							resultArgs
						);
						this.setToolResult( tool_call.id, '' );
				}
			}
		} else {
			this.assistantMessage = result.content;
		}
	}

	async call( message, args ) {
		while ( true ) {
			this.messages.push( {
				role: 'assistant',
				content: this.assistantMessage || args.question,
			} );
			console.log( this.assistantMessage || args.question );
			const userMessage = this.prompt( '> ' );

			if ( userMessage.toLowerCase() === 'exit' ) {
				console.log( 'Goodbye!' );
				process.exit( 0 );
			}
			this.messages.push( { role: 'user', content: userMessage } );

			await this.runCompletion();
		}
	}
}

const simpleAgentToolkit = new SimpleAgentToolkit( {
	agents,
} );
const chat = new CLIChat();
const agent = new WapuuAgent( chat, simpleAgentToolkit );
chat.setAgent( agent );
chat.call( 'askUser', { question: 'What would you like to do?' } );
