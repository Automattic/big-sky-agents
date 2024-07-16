/**
 * WordPress dependencies
 */

/**
 * Internal dependencies
 */
import AgentUI from './agent-ui.jsx';
import ChatHistory from './chat-history.jsx';
import { ChatModelService, ChatModelType } from '../ai/chat-model.js';
import './chat-demo-ui.scss';

// providers allow us to inject and sandbox certain configurations from other components on the page
import { AgentsProvider, useAgent } from './agents-provider';
import { ChatProvider } from './chat-provider';
import { ToolkitsProvider, useToolkit } from './toolkits-provider';

// Toolkits allows us to register tools and state that use redux stores and can integrate with core Gutenberg libraries
// the Agent Toolkit supports core functionality like determining the current agent and switching agents
import useAgentExecutor from '../hooks/use-agent-executor.js';
import PopUpControls from './popup-controls.jsx';
import { DotPromptTemplate } from '../ai/prompt-template.js';
import useAskUserToolkit from '../hooks/use-ask-user-toolkit.js';
import AskUserToolkit from '../ai/toolkits/ask-user-toolkit.js';

const SingleAssistantDemoUI = () => {
	useAgent( WeatherAgent );
	useAskUserToolkit();
	useToolkit( GetWeatherToolkit );
	useAgentExecutor();

	return (
		<>
			<AgentUI />
			<PopUpControls />
			<ChatHistory />
		</>
	);
};

const CurrentLocationPrompt = new DotPromptTemplate( {
	template: `The user's current location is {{= it.currentLocation }}.`,
	inputVariables: [ 'currentLocation' ],
} );

const GetWeatherToolkit = {
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
};

const WeatherAgent = {
	id: 'weatherbot',
	name: 'WeatherBot',
	description: 'Looks up the weather for you',
	instructions: 'You are a helpful weather bot',
	additionalInstructions: ( context ) => {
		return CurrentLocationPrompt.format( context );
	},
	toolkits: [ AskUserToolkit.name, GetWeatherToolkit.name ],
	onStart: ( invoke ) => {
		invoke.askUser( {
			question: 'What location would you like the weather for?',
			choices: [
				'Boston, MA',
				'New York, NY',
				'San Francisco, CA',
				'Compare the weather in London and Melbourne',
			],
		} );
	},
};

const DemoWithSingleAgent = ( { apiKey } ) => {
	return (
		<ToolkitsProvider toolkits={ [ AskUserToolkit, GetWeatherToolkit ] }>
			<AgentsProvider>
				<ChatProvider
					service={ ChatModelService.OPENAI }
					model={ ChatModelType.GPT_4O }
					apiKey={ apiKey }
					feature={ 'big-sky' }
				>
					<SingleAssistantDemoUI />
				</ChatProvider>
			</AgentsProvider>
		</ToolkitsProvider>
	);
};

export default DemoWithSingleAgent;
