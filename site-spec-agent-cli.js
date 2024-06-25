import dotenv from 'dotenv';
import ChatModel, {
	ChatModelService,
	ChatModelType,
} from './src/agents/chat-model.js';
import SimpleAgentToolkit from './src/agents/toolkits/simple-agent.js';
import SimpleSiteToolkit from './src/agents/toolkits/simple-site.js';
import CombinedToolkit from './src/agents/toolkits/combined.js';
import SiteSpecAgent from './src/agents/site-spec-agent.js';
import WapuuAgent from './src/agents/wapuu-agent.js';
import promptSync from 'prompt-sync';
import agents from './src/agents/default-agents.js';
import AssistantModel from './src/agents/assistant-model.js';

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
	}

	findTools( ...toolNames ) {
		return this.tools.filter( ( tool ) =>
			toolNames.includes( tool.function.name )
		);
	}

	async runCompletion() {
		const callbacks = this.agent.toolkit.getCallbacks();
		const values = this.agent.toolkit.getValues();
		console.log(
			'instructions',
			this.agent.getInstructions().format( values )
		);
		console.log( 'this.messages', this.messages );
		const request = {
			model: ChatModelType.GPT_4O,
			messages: this.messages,
			tools: this.agent.getTools( values ),
			instructions: this.agent.getInstructions().format( values ),
			additionalInstructions: this.agent
				.getAdditionalInstructions()
				.format( values ),
			temperature: 0.2,
		};
		const result = await this.model.run( request );

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
				await Promise.all( promises );
			}

			const callback = callbacks[ tool_call.function.name ];

			if ( typeof callback === 'function' ) {
				console.warn( '🧠 Tool callback', tool_call.function.name );
				await callback( resultArgs );
				await this.runCompletion();
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

// const tools = [ AskUserTool ];
const simpleSiteToolkit = new SimpleSiteToolkit();
const simpleAgentToolkit = new SimpleAgentToolkit( {
	agents,
} );
const combinedToolkit = new CombinedToolkit( {
	toolkits: [ simpleSiteToolkit, simpleAgentToolkit ],
} );
const chat = new CLIChat();
const agent = new WapuuAgent( chat, simpleAgentToolkit );

chat.agent = agent;
agent.onStart();
