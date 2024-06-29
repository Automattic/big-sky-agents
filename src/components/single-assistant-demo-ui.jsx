/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useState } from 'react';
import { Flex } from '@wordpress/components';

/**
 * Internal dependencies
 */
import SiteSpecPreview from './site-spec-preview.jsx';
import PageSpecPreview from './page-spec-preview.jsx';
import AgentUI from './agent-ui.jsx';
import ChatHistory from './chat-history.jsx';
import PageList from './page-list.jsx';
import useReduxAgentToolkit from '../hooks/use-redux-agent-toolkit.js';
// import useAssistantExecutor from '../hooks/use-assistant-executor.js';
import useChatExecutor from '../hooks/use-chat-executor.js';
import { store as siteSpecStore } from '../store/index.js';
import { useSelect } from '@wordpress/data';
import useChat from './chat-provider/use-chat.js';
import './agents-demo-ui.scss';
import AgentsProvider from './agents-provider/context.jsx';
import ToolsProvider from './tools-provider/context.jsx';
import AskUserTool from '../ai/tools/ask-user.js';
import InformUserTool from '../ai/tools/inform-user.js';
import PopUpControls from './popup-controls.jsx';

// if you want to use the default registry, you can just import the default which is shared by all consumers

// import defaultAgentRegistry from '../ai/agents/default-agents.js';
// import createAgentRegistry from '../ai/agents/agent-registry.js';
// import createToolRegistry from '../ai/tools/tool-registry.js';

// const agentRegistry = createAgentRegistry();
// const toolRegistry = createToolRegistry();

// toolRegistry.registerTool( 'getWeather', {
// 	name: 'Get Weather',
// 	description: 'Get the weather for a location',
// 	parameters: {
// 		type: 'object',
// 		properties: {
// 			location: {
// 				type: 'string',
// 			},
// 		},
// 		required: [ 'location' ],
// 	},
// 	callback: async ( { location } ) => {
// 		const response = await fetch(
// 			`https://wttr.in/${ location }?format=%C+%t`
// 		);
// 		const text = await response.text();
// 		return text;
// 	},
// } );

// agentRegistry.registerAgent( 'demo-agent', {
// 	name: 'WeatherBot',
// 	description: 'Looks up the weather for you',
// 	instructions: 'You are a helpful weather bot',
// 	tools: [ 'getWeather' ],
// } );

/**
 * An "Assistant" is just a server-side version of an Agent. We should probably come up with better names for these.
 *
 * This component displays the user interface for the Assistants Demo, which allows users to interact with assistants and preview generated content.
 *
 * <!--
 * @param {Object}   root0                 The component props.
 * @param {string}   root0.apiKey          The token to use for the chat model.
 * @param {Function} root0.onApiKeyChanged Callback function to call when the token changes.
 *                                         -->
 */

const SingleAssistantDemoUI = ( { apiKey, onApiKeyChanged } ) => {
	const [ previewVisible, setPreviewVisible ] = useState( false );
	const [ selectedPageId, setSelectedPageId ] = useState( null );

	const chat = useChat();

	// if chat.apiKey !== apiKey, set it
	useEffect( () => {
		if ( chat.apiKey !== apiKey ) {
			chat.setApiKey( apiKey );
		}
	}, [ apiKey, chat ] );

	// set the feature to big-sky
	useEffect( () => {
		if ( chat.feature !== 'big-sky' ) {
			chat.setFeature( 'big-sky' );
		}
	}, [ chat ] );

	const toolkit = useReduxAgentToolkit( {
		apiKey,
	} );

	// run the agent
	useChatExecutor();

	const { pages } = useSelect( ( select ) => {
		return {
			pages: select( siteSpecStore ).getPages(),
		};
	} );

	const onSelectPage = useCallback( async ( pageId ) => {
		if ( pageId ) {
			setSelectedPageId( pageId );
		} else {
			setSelectedPageId( null );
		}
	}, [] );

	// the first time agentState gets set to "running", we should show the preview
	useEffect( () => {
		if ( ! previewVisible && chat.running ) {
			setPreviewVisible( true );
		}
	}, [ chat.running, previewVisible ] );

	return (
		<>
			<Flex direction="row" align="stretch" justify="center">
				<div className="big-sky__agent-column">
					<AgentUI toolkit={ toolkit } />
				</div>
				{ previewVisible && (
					<div className="big-sky__current-preview-wrapper">
						{ selectedPageId ? (
							<PageSpecPreview
								disabled={ toolkit.running }
								pageId={ selectedPageId }
							/>
						) : (
							<SiteSpecPreview disabled={ toolkit.running } />
						) }
					</div>
				) }

				{ pages?.length > 0 && (
					<div className="big-sky__page-list-wrapper">
						<PageList
							pages={ pages }
							disabled={ toolkit.running }
							onSelectPage={ onSelectPage }
						/>
					</div>
				) }
			</Flex>
			<ChatHistory />
			<PopUpControls toolkit={ toolkit } setApiKey={ onApiKeyChanged } />
		</>
	);
};

const DemoWithSingleAgent = ( props ) => {
	return (
		<ToolsProvider
			tools={ [
				AskUserTool,
				{
					...InformUserTool,
					callback: ( { message } ) => `Agent thought: ${ message }`,
				},
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
					callback: async ( { location } ) => {
						const response = await fetch(
							`https://wttr.in/${ location }?format=%C+%t`
						);
						const text = await response.text();
						return text;
					},
				},
			] }
		>
			<AgentsProvider
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
								],
							} );
						},
					},
				] }
			>
				<SingleAssistantDemoUI { ...props } />
			</AgentsProvider>
		</ToolsProvider>
	);
};

export default DemoWithSingleAgent;
