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
import ChatModelControls from './chat-model-controls.jsx';
import AgentControls from './agent-controls.jsx';
import ChatHistory from './chat-history.jsx';
import PageList from './page-list.jsx';
import useReduxToolkit from '../hooks/use-redux-toolkit.js';
import useCurrentAgent from '../hooks/use-current-agent.js';
import useAssistantExecutor from '../hooks/use-assistant-executor.js';
import useToolExecutor from '../hooks/use-tool-executor.js';
import useAgentStarter from '../hooks/use-agent-starter.js';
import { store as siteSpecStore } from '../store/index.js';
import { useSelect } from '@wordpress/data';
import useChat from './chat-provider/use-chat.js';
import './agents-demo-ui.scss';

class ToolRegistry {
	static registerTool( toolId, tool ) {
		if ( ! this.tools ) {
			this.tools = {};
		}
		this.tools[ toolId ] = tool;
	}
}

class ToolkitRegistry {
	static registerToolkit( toolkitId, toolkit ) {
		if ( ! this.toolkits ) {
			this.toolkits = {};
		}
		this.toolkits[ toolkitId ] = toolkit;
	}
}

class AgentRegistry {
	// static registerAgent method
	static registerAgent( agentId, agent ) {
		if ( ! this.agents ) {
			this.agents = {};
		}
		this.agents[ agent.id ] = agent;
	}
}

const agentRegistry = new AgentRegistry();
const toolRegistry = new ToolRegistry();
const toolkitRegistry = new ToolkitRegistry();

toolRegistry.registerTool(
	SetSiteTitleTool.function.name,
	async ( { siteTitle } ) => {
		// do something with the value
	}
);

// or, register with the tool instance, which looks like a normal OpenAI tool
toolRegistry.registerTool( SetSiteTitleTool, async ( { siteTitle } ) => {
	// do something with the value
} );

// or, register using just an object
toolRegistry.registerTool( {
	name: 'Set Site Title',
	description: 'Set the site title',
	callback: async ( { siteTitle } ) => {
		// do something with the value
	},
} );

// can be a class or an object, allowing sharing of agent definitions with non-UI JS apps.
toolkitRegistry.registerToolkit( 'big-sky', ReduxToolkit );
toolkitRegistry.registerToolkit( 'settings', {
	values: () => ( {
		siteTitle: 'My Site',
	} ),
	// can be a static array or a function that returns an array
	tools: [ SetSiteTitleTool ],
	callbacks: {
		[ SetSiteTitleTool.function.name ]: async ( { siteTitle } ) => {
			// do something
		},
	},
} );

// can be a class or an object
agentRegistry.registerAgent( 'wapuu', WapuuAgent );
agentRegistry.registerAgent( 'wapuu', {
	name: 'My Agent',
	toolkits: [ 'big-sky' ],
	tools: ( values ) => {
		return [ InformTool ];
	},
	instructions: ( values ) => {
		return `Hello, I am ${ values.agent.name }`;
	},
} );

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
	const [ controlsVisible, setControlsVisible ] = useState( false );
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

	const toolkit = useReduxToolkit( {
		apiKey,
		pageId: selectedPageId,
	} );

	const agent = useAgent( {
		toolkit,
	} );

	// run the agent
	useAssistantExecutor( {
		agent,
	} );

	useToolExecutor( {
		toolkit,
	} );

	useAgentStarter( {
		agent,
	} );

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

	// show the debug window when CTRL-D is pressed
	useEffect( () => {
		const handleKeyDown = ( event ) => {
			if ( event.ctrlKey && event.key === 'd' ) {
				setControlsVisible( ( prevVisible ) => ! prevVisible );
			}
		};

		window.addEventListener( 'keydown', handleKeyDown );

		return () => {
			window.removeEventListener( 'keydown', handleKeyDown );
		};
	}, [] );

	return (
		<>
			<Flex direction="row" align="stretch" justify="center">
				<div className="big-sky__agent-column">
					<AgentUI
						toolkit={ toolkit }
						agent={ agent }
						chat={ chat }
					/>
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
			<ChatHistory
				history={ chat.history }
				toolOutputs={ chat.toolOutputs }
			/>
			{ controlsVisible && (
				<div className="big-sky__agent-debug">
					<AgentControls
						toolkit={ toolkit }
						agent={ agent }
						chat={ chat }
					/>
					<ChatModelControls
						{ ...chat }
						setApiKey={ ( newApiKey ) => {
							chat.setApiKey( newApiKey );
							if ( typeof onApiKeyChanged === 'function' ) {
								onApiKeyChanged( newApiKey );
							}
						} }
					/>
				</div>
			) }
		</>
	);
};

export default SingleAssistantDemoUI;
