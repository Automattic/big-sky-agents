import dotenv from 'dotenv';
import minimist from 'minimist';
import ChatModel, {
	ChatModelService,
	ChatModelType,
} from './src/agents/chat-model.js';
import InMemoryStateManager from './src/agents/state-managers/in-memory.js';
import BaseAgentToolkit from './src/agents/toolkits/base-agent.js';
import CombinedToolkit from './src/agents/toolkits/combined.js';
import promptSync from 'prompt-sync';
import AssistantModel from './src/agents/assistant-model.js';

import agents, { WAPUU_AGENT_ID } from './src/agents/default-agents.js';
import { ASK_USER_TOOL_NAME } from './src/agents/tools/ask-user.js';
import { CONFIRM_TOOL_NAME } from './src/agents/tools/confirm.js';

dotenv.config();
const args = minimist( process.argv.slice( 2 ) );

function logVerbose( ...stuffToLog ) {
	if ( args.verbose ) {
		console.log( ...stuffToLog );
	}
}

class CLIChat {
	constructor() {
		this.assistantMessage = '';
		this.assistantChoices = [];
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
		this.assistantMessage = agent.getDefaultQuestion();
		this.assistantChoices = agent.getDefaultChoices();
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
		const request = {
			model: ChatModelType.GPT_4O,
			messages: this.messages,
			tools: this.agent.getTools(),
			instructions: this.agent.getInstructions(),
			additionalInstructions: this.agent.getAdditionalInstructions(),
			temperature: 0,
		};
		logVerbose( '📡 Request:', request );
		const result = await this.model.run( request );
		logVerbose( '🧠 Result:', result, result.tool_calls?.[ 0 ].function );

		if ( result.tool_calls ) {
			// use the first tool call for now
			this.messages.push( result );
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
						logVerbose(
							'🔧 Parallel tool callback',
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
				logVerbose(
					'🔧 Tool callback',
					tool_call.function.name,
					resultArgs
				);
				this.setToolResult(
					tool_call.id,
					await callback( resultArgs )
				);
				const agentId = this.agent.toolkit.values.agent.id;
				if ( agentId && agentId !== this.agent.getId() ) {
					logVerbose( `🔄 Switching to new agent ${ agentId }` );
					const newAgent = agents.find( ( ag ) => ag.id === agentId );
					if ( newAgent ) {
						let toolkit;
						if ( newAgent.toolkit ) {
							toolkit = new CombinedToolkit( {
								toolkits: [
									new newAgent.toolkit(
										{ agents },
										this.agent.toolkit.stateManager
									),
									this.agent.toolkit,
								],
							} );
						} else {
							toolkit = this.agent.toolkit;
						}

						this.setAgent( new newAgent.agent( this, toolkit ) );
					} else {
						const defaultAgent = agents.find(
							( ag ) => ag.id === WAPUU_AGENT_ID
						);
						this.setAgent(
							new defaultAgent.agent( this, this.agent.toolkit )
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
					case CONFIRM_TOOL_NAME:
						this.assistantMessage = resultArgs.message;
						this.setToolResult( tool_call.id, resultArgs.message );
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

	buildMessage() {
		let message = this.assistantMessage;
		if ( this.assistantChoices ) {
			message += '\n\nHere are some choices available to you:\n';
			message += this.assistantChoices
				.map( ( choice, index ) => `${ index + 1 }. ${ choice }` )
				.join( '\n' );
			this.assistantChoices = null;
		}
		return message;
	}

	async call() {
		while ( true ) {
			const message = this.buildMessage();

			this.messages.push( {
				role: 'assistant',
				content: message,
			} );
			console.log(
				'==========================================================================================================='
			);
			console.log( `❓ ${ message }` );
			console.log(
				'==========================================================================================================='
			);
			const userMessage = this.prompt( '> ' );

			if ( ! userMessage || userMessage.toLowerCase() === 'exit' ) {
				console.log( 'Goodbye!' );
				process.exit( 0 );
			}
			this.messages.push( { role: 'user', content: userMessage } );

			await this.runCompletion();
		}
	}
}

const INITIAL_STATE = {
	agentId: null,
	agentGoal: "Understand the user's goal",
	agentThought: null,
	textColor: undefined,
	backgroundColor: undefined,
	accentColor: undefined,
	siteTitle: undefined,
	siteDescription: undefined,
	siteTopic: undefined,
	siteType: undefined,
	siteLocation: undefined,
	pages: [],
};
const stateManager = new InMemoryStateManager( INITIAL_STATE );

const chat = new CLIChat();
const baseAgentToolkit = new BaseAgentToolkit(
	{
		agents,
	},
	stateManager
);
const defaultAgent = args.agent
	? agents.find( ( ag ) => ag.id === args.agent )
	: agents.find( ( ag ) => ag.id === WAPUU_AGENT_ID );

const defaultToolkit =
	defaultAgent.id !== WAPUU_AGENT_ID
		? new CombinedToolkit( {
				toolkits: [
					new defaultAgent.toolkit( { agents }, stateManager ),
					baseAgentToolkit,
				],
		  } )
		: baseAgentToolkit;

const agent = new defaultAgent.agent( chat, defaultToolkit );

chat.setAgent( agent );
chat.call();
