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
import { AgentsProvider } from './agents-provider';
import { ChatProvider } from './chat-provider';
import { ToolkitsProvider } from './toolkits-provider';

// Toolkits allows us to register tools and state that use redux stores and can integrate with core Gutenberg libraries
// the Agent Toolkit supports core functionality like determining the current agent and switching agents
import useAgentToolkit from '../hooks/use-agent-toolkit.js';
import useAgentExecutor from '../hooks/use-agent-executor.js';
import PopUpControls from './popup-controls.jsx';

const SingleAssistantDemoUI = () => {
	useAgentToolkit();
	useAgentExecutor();

	return (
		<>
			<AgentUI />
			<PopUpControls />
			<ChatHistory />
		</>
	);
};

const GetWeatherTool = {
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
};

const GetWeatherToolkit = {
	name: 'weather',
	context: {
		exampleValue: 'foo',
	},
	tools: [ GetWeatherTool ],
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
	toolkits: [ 'agents', 'weather' ],
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
		<ToolkitsProvider toolkits={ [ GetWeatherToolkit ] }>
			<AgentsProvider
				agentGoal="Help the user find out about the weather"
				agentThought="I am going to help the user find out about the weather"
				activeAgentId="weatherbot"
				agents={ [ WeatherAgent ] }
			>
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
