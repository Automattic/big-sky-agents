import dotenv from 'dotenv';
import minimist from 'minimist';
import ChatModel, {
	ChatModelService,
	ChatModelType,
} from './src/ai/chat-model.js';
import { WAPUU_AGENT_ID } from './src/ai/agents/wapuu-agent.js';
import promptSync from 'prompt-sync';
import AssistantModel from './src/ai/assistant-model.js';

import defaultAgents from './src/ai/agents/default-agents.js';
import { CONFIRM_TOOL_NAME } from './src/ai/tools/confirm.js';

import { dispatch, select } from '@wordpress/data';

import AskUserTool, { ASK_USER_TOOL_NAME } from './src/ai/tools/ask-user.js';
import InformTool from './src/ai/tools/inform-user.js';
import AnalyzeUrlTool from './src/ai/tools/analyze-url.js';
import createSetAgentTool, {
	SET_AGENT_TOOL_NAME,
} from './src/ai/tools/set-agent.js';
import SetGoalTool from './src/ai/tools/set-goal.js';
import {
	SetSiteDescriptionTool,
	SetSiteLocationTool,
	SetSitePagesTool,
	SetSiteTitleTool,
	SetSiteTopicTool,
	SetSiteTypeTool,
} from './src/ai/tools/site-tools.js';
import { store } from './src/store/index.js';

dotenv.config();
const args = minimist( process.argv.slice( 2 ) );

function logVerbose( ...stuffToLog ) {
	if ( args.verbose ) {
		console.log( ...stuffToLog );
	}
}

class CLIChat {
	constructor( _store ) {
		this.store = _store;

		const agent = select( this.store ).getActiveAgent();
		agent.onStart( {
			askUser: ( { question, choices } ) => {
				this.assistantMessage = question;
				this.assistantChoices = choices;
			},
		} );

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

	setToolResult( toolId, result ) {
		this.messages.push( {
			role: 'tool',
			tool_call_id: toolId,
			content: result,
		} );
	}

	async runCompletion() {
		const agent = select( this.store ).getActiveAgent();
		const toolkits = select( this.store ).getToolkits();

		// Merge context from all toolkits
		const context = {
			agents: select( store ).getAgents(),
			agent: {
				id: select( store ).getActiveAgent()?.id,
				name: select( store ).getActiveAgent()?.name,
				assistantId: select( store ).getActiveAgent()?.assistantId,
				goal: select( store ).getAgentGoal(),
				thought: select( store ).getAgentThought(),
			},
			site: {
				title: select( store ).getSiteTitle(),
			},
		};

		const callbacks = toolkits.reduce( ( acc, toolkit ) => {
			const toolkitCallbacks =
				typeof toolkit.callbacks === 'function'
					? toolkit.callbacks()
					: toolkit.callbacks;
			return {
				...acc,
				...toolkitCallbacks,
			};
		}, {} );

		const allTools = toolkits.reduce( ( acc, toolkit ) => {
			const toolkitTools =
				typeof toolkit.tools === 'function'
					? toolkit.tools( context )
					: toolkit.tools;
			return [
				...acc,
				...toolkitTools.filter(
					( tool ) => ! acc.some( ( t ) => t.name === tool.name )
				),
			];
		}, [] );
		let tools =
			typeof agent.tools === 'function'
				? agent.tools( context )
				: agent.tools;
		// map string tools to globally registered tool definitions
		tools = tools
			.map( ( tool ) => {
				if ( typeof tool === 'string' ) {
					const registeredTool = allTools.find(
						( t ) => t.name === tool
					);
					if ( ! registeredTool ) {
						console.warn( '🧠 Tool not found', tool );
					}
					return registeredTool;
				}
				return tool;
			} )
			.filter( Boolean );
		// remap to an OpenAI tool
		tools = tools.map( ( tool ) => ( {
			type: 'function',
			function: {
				name: tool.name,
				description: tool.description,
				parameters: tool.parameters,
			},
		} ) );

		const request = {
			model: ChatModelType.GPT_4O,
			messages: this.messages,
			tools,
			instructions: agent.instructions( context ),
			additionalInstructions: agent.additionalInstructions( context ),
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
				const newAgentId = resultArgs.agentId;
				if ( newAgentId && newAgentId !== agent.id ) {
					logVerbose( `🔄 Switching to new agent ${ newAgentId }` );
					dispatch( store ).setActiveAgent( newAgentId );
					const newAgent = select( this.store ).getActiveAgent();
					newAgent.onStart( {
						askUser: ( { question, choices } ) => {
							this.assistantMessage = question;
							this.assistantChoices = choices;
						},
					} );
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

// register agents
defaultAgents.forEach( ( agent ) => {
	dispatch( store ).registerAgent( agent );
} );
// set default Wapuu agent
dispatch( store ).setActiveAgent( WAPUU_AGENT_ID );

// register toolkits
dispatch( store ).registerToolkit( {
	name: 'agents',
	tools: [
		AskUserTool,
		SetGoalTool,
		InformTool,
		createSetAgentTool( select( store ).getAgents() ),
		AnalyzeUrlTool,
	],
	callbacks: {
		[ InformTool.name ]: ( { message } ) => {
			dispatch( store ).setAgentThought( message );
			return message ? `Agent thinks: "${ message }"` : 'Thought cleared';
		},
		[ SetGoalTool.name ]: ( { goal: newGoal } ) => {
			dispatch( store ).setAgentGoal( newGoal );
			return `Goal set to "${ newGoal }"`;
		},
		[ SET_AGENT_TOOL_NAME ]: ( { agentId } ) => {
			dispatch( store ).setActiveAgent( agentId );
			return `Agent set to ${ agentId }`;
		},
	},
} );

dispatch( store ).registerToolkit( {
	name: 'site',
	tools: [
		SetSiteTitleTool,
		SetSiteDescriptionTool,
		SetSiteTypeTool,
		SetSiteTopicTool,
		SetSiteLocationTool,
		SetSitePagesTool,
	],
	callbacks: {
		[ SetSiteTitleTool.name ]: ( { value } ) => {
			dispatch( store ).setSiteTitle( value );
			return `Site title set to "${ value }"`;
		},
		[ SetSiteTypeTool.name ]: ( { value } ) => {
			dispatch( store ).setSiteType( value );
			return `Site type set to "${ value }"`;
		},
		[ SetSiteTopicTool.name ]: ( { value } ) => {
			dispatch( store ).setSiteTopic( value );
			return `Site topic set to "${ value }"`;
		},
		[ SetSiteLocationTool.name ]: ( { value } ) => {
			dispatch( store ).setSiteLocation( value );
			return `Site location set to "${ value }"`;
		},
		[ SetSiteDescriptionTool.name ]: ( { value } ) => {
			dispatch( store ).setSiteDescription( value );
			return `Site description set to "${ value }"`;
		},
		[ SetSitePagesTool.name ]: ( { pages } ) => {
			dispatch( store ).setPages( pages );
			return 'Site pages set';
		},
	},
} );

const chat = new CLIChat( store );
chat.call();
