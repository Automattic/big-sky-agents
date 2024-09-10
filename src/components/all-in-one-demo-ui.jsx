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

const AllInOneDemo = () => {
	useAgent( WeatherAgent );
	useAgentExecutor();
	return (
		<>
			<ChatHistory />
			<UserMessageInput />
			<PopUpControls />
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

/**
 * This demo uses ToolkitsProvider, AgentsProvider, ChatProvider, and PopUpControls to provide a completely standlone
 * agent environment which does not use tools, toolkits, agents or context from any other components in the browser.
 *
 * It demonstrates a "Weather Agent" which can look up the weather. The entire toolkit and tools are defined within the agent.
 * <!--
 * @param {Object} root0
 * @param {string} root0.apiKey
 * @return {JSX.Element}  The AllInOneDemo component
 * -->
 */
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
