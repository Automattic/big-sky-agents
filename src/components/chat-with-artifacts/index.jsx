/**
 * WordPress dependencies
 */
import { useCallback, useState } from '@wordpress/element';
import { Flex } from '@wordpress/components';

/**
 * Internal dependencies
 */
import SiteSpecPreview from '../site-spec-preview.jsx';
import PageSpecPreview from '../page-spec-preview.jsx';
import AgentUI from '../agent-ui.jsx';
import ChatHistory from './chat-history.jsx';
import ArtifactList from './artifact-list.jsx';
// import { store as siteSpecStore } from '../store/index.js';
import { useSelect } from '@wordpress/data';
import useChatSettings from '../../hooks/use-chat-settings.js';
import {
	AssistantModelService,
	AssistantModelType,
} from '../../ai/assistant-model.js';
import {
	WAPUU_AGENT_ID,
	WAPUU_ASSISTANT_ID,
} from '../../ai/agents/wapuu-agent.js';
import '../chat-demo-ui.scss';
import PopUpControls from '../popup-controls.jsx';
import { AgentsProvider, useAgent } from '../agents-provider';
// import useAnalyzeSiteToolkit from '../hooks/use-analyze-site-toolkit.js';
import useAgentExecutor from '../../hooks/use-agent-executor.js';
import useAgentsToolkit from '../../hooks/use-agents-toolkit.js';
// import useSiteToolkit from '../hooks/use-site-toolkit.js';
// import useGoalToolkit from '../hooks/use-goal-toolkit.js';
import useInformToolkit from '../../hooks/use-inform-toolkit.js';
import useAskUserToolkit from '../../hooks/use-ask-user-toolkit.js';
import AskUserToolkit from '../../ai/toolkits/ask-user-toolkit.js';
import InformToolkit from '../../ai/toolkits/inform-toolkit.js';

const GraphAgent = {
	id: 'graph-example',
	name: 'Graph Example',
	graphId: 'memory', // this is a named graph, change to suit your application
	instructions:
		'You are a helpful assistant that can answer questions and help with tasks.',
	toolkits: [ AskUserToolkit, InformToolkit ],
	onStart: ( invoke ) => {
		invoke.agentSay( 'What would you like to do?' );
	},
};

/**
 * An "Assistant" is just a server-side version of an Agent. We should probably come up with better names for these.
 *
 * This component displays the user interface for the Assistants Demo, which allows users to interact with assistants and preview generated content.
 *
 * <!--
 * @param {Object}   root0                 The component props.
 * @param {string}   root0.baseUrl         The base URL for the LangGraph Cloud API.
 * @param {string}   root0.apiKey          The token to use for the chat model.
 * @param {Function} root0.onApiKeyChanged Callback function to call when the token changes.
 *                                         -->
 */
const ChatWithArtifacts = ( { baseUrl, apiKey, onApiKeyChanged } ) => {
	const [ selectedPageId, setSelectedArtifactId ] = useState( null );

	useChatSettings( {
		apiKey,
		feature: 'big-sky',
		assistantEnabled: true,
		service: AssistantModelService.LANGGRAPH_CLOUD,
		model: AssistantModelType.GPT_4O,
		baseUrl,
		initialAgentId: GraphAgent.id,
		autoCreateAssistant: true,
	} );

	useAgent( GraphAgent );
	useAgentsToolkit();
	// useAnalyzeSiteToolkit( { apiKey } );
	// useSiteToolkit( { pageId: selectedPageId } );
	// useAskUserToolkit();
	// useGoalToolkit();
	// useInformToolkit();
	useAgentExecutor();

	const { artifacts } = useSelect( ( select ) => {
		return {
			artifacts: [], //select( artifactStore ).getArtifacts(),
		};
	} );

	const onSelectArtifact = useCallback( async ( artifactId ) => {
		if ( artifactId ) {
			setSelectedArtifactId( artifactId );
		} else {
			setSelectedArtifactId( null );
		}
	}, [] );

	return (
		<>
			<Flex direction="row" align="stretch" justify="center">
				<div className="big-sky__agent-column">
					<AgentUI />
				</div>
				<div className="big-sky__current-preview-wrapper">
					{ selectedPageId ? (
						<PageSpecPreview pageId={ selectedPageId } />
					) : (
						<SiteSpecPreview />
					) }
				</div>

				{ artifacts?.length > 0 && (
					<div className="big-sky__artifact-list-wrapper">
						<ArtifactList
							pages={ artifacts }
							onSelectPage={ onSelectArtifact }
						/>
					</div>
				) }
			</Flex>
			<ChatHistory />
			<PopUpControls setApiKey={ onApiKeyChanged } />
		</>
	);
};

export default ChatWithArtifacts;
