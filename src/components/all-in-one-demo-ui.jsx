/**
 * WordPress dependencies
 */

/**
 * Internal dependencies
 */
import ChatHistory from './chat-history.jsx';
import { ChatModelService, ChatModelType } from '../ai/chat-model.js';
import './chat-demo-ui.scss';

// providers allow us to inject and sandbox certain configurations from other components on the page
import { AgentsProvider, useAgent } from './agents-provider/index.js';
import { ChatProvider } from './chat-provider/index.js';
import { ToolkitsProvider } from './toolkits-provider/index.js';

// Toolkits allows us to register tools and state that use redux stores and can integrate with core Gutenberg libraries
// the Agent Toolkit supports core functionality like determining the current agent and switching agents
import useAgentExecutor from '../hooks/use-agent-executor.js';
import PopUpControls from './popup-controls.jsx';
import UserMessageInput from './user-message-input.jsx';
import MessageContent from './message-content.jsx';
import useChat from './chat-provider/use-chat.js';

const AllInOneDemo = () => {
	useAgent( WeatherAgent );
	useAgentExecutor();
	const { assistantMessage } = useChat();

	return (
		<>
			{ assistantMessage && (
				<>
					<MessageContent content={ assistantMessage } />
					<UserMessageInput />
				</>
			) }
			<PopUpControls />
			<ChatHistory />
		</>
	);
};

const WeatherAgent = {
	id: 'weatherbot',
	name: 'Weather Bot',
	instructions: 'You are a helpful weather bot',
	additionalInstructions: ( context ) => {
		return `The user's current location is ${ context.currentLocation }.`;
	},
	toolkits: [
		{
			name: 'weather',
			context: {
				currentLocation: 'Melbourne, Australia',
			},
			tools: [
				{
					name: 'getWeather',
					description: 'Get the weather for a location',
					parameters: {
						type: 'object',
						properties: {
							location: {
								type: 'string',
							},
						},
						required: [ 'location' ],
					},
				},
			],
			callbacks: {
				getWeather: async ( { location } ) => {
					const response = await fetch(
						`https://wttr.in/${ location }?format=%C+%t`
					);
					const text = await response.text();
					return text;
				},
			},
		},
	],
	onStart: ( invoke ) => {
		console.warn( 'Weather Agent started' );
		invoke.agentSay( 'What location would you like the weather for?' );
	},
};

const DemoWithAllInOneAgent = ( { apiKey } ) => {
	return (
		<ToolkitsProvider>
			<AgentsProvider>
				<ChatProvider
					service={ ChatModelService.OPENAI }
					model={ ChatModelType.GPT_4O }
					apiKey={ apiKey }
					feature={ 'big-sky' }
				>
					<AllInOneDemo />
				</ChatProvider>
			</AgentsProvider>
		</ToolkitsProvider>
	);
};

export default DemoWithAllInOneAgent;
