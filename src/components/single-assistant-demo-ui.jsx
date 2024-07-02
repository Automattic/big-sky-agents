/**
 * WordPress dependencies
 */
import { useCallback, useState } from 'react';
import { Flex } from '@wordpress/components';

/**
 * Internal dependencies
 */
import SiteSpecPreview from './site-spec-preview.jsx';
import PageSpecPreview from './page-spec-preview.jsx';
import AgentUI from './agent-ui.jsx';
import AgentsToolkit from '../ai/toolkits/agents.js';
import ChatHistory from './chat-history.jsx';
import PageList from './page-list.jsx';

import { store as siteSpecStore } from '../store/index.js';
import { useSelect } from '@wordpress/data';
import { ChatModelService, ChatModelType } from '../ai/chat-model.js';
import './agents-demo-ui.scss';

// providers allow us to inject and sandbox certain configurations from other components on the page
import { AgentsProvider } from './agents-provider';
import { ChatProvider } from './chat-provider';
import { ToolkitsProvider } from './toolkits-provider';
import useAgentToolkit from '../hooks/use-agent-toolkit.js';
import PopUpControls from './popup-controls.jsx';

const SingleAssistantDemoUI = () => {
	useAgentToolkit();

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
	name: 'getWeatherToolkit',
	values: {
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

const DemoWithSingleAgent = ( { apiKey } ) => {
	return (
		<AgentsProvider
			goal="Help the user find out about the weather"
			thought="I am going to help the user find out about the weather"
			activeAgentId="weatherbot"
			agents={ [
				{
					id: 'weatherbot',
					name: 'WeatherBot',
					description: 'Looks up the weather for you',
					instructions: 'You are a helpful weather bot',
					onStart: ( invoke ) => {
						invoke.askUser( {
							question:
								'What location would you like the weather for?',
							choices: [
								'Boston, MA',
								'New York, NY',
								'San Francisco, CA',
								'Compare the weather in London and Melbourne',
							],
						} );
					},
				},
			] }
		>
			<ToolkitsProvider toolkits={ [ GetWeatherToolkit ] }>
				<ChatProvider
					service={ ChatModelService.OPENAI }
					model={ ChatModelType.GPT_4O }
					apiKey={ apiKey }
					feature={ 'big-sky' }
					assistantEnabled={ false }
				>
					<SingleAssistantDemoUI />
				</ChatProvider>
			</ToolkitsProvider>
		</AgentsProvider>
	);
};

export default DemoWithSingleAgent;
