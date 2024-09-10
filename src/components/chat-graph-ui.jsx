/**
 * WordPress dependencies
 */
import { useCallback, useState } from '@wordpress/element';
import { Flex } from '@wordpress/components';

/**
 * Internal dependencies
 */
import SiteSpecPreview from './site-spec-preview.jsx';
import PageSpecPreview from './page-spec-preview.jsx';
import AgentUI from './agent-ui.jsx';
import PopUpControls from './popup-controls.jsx';
import PageList from './page-list.jsx';
import { store as siteSpecStore } from '../store/index.js';
import { useSelect } from '@wordpress/data';
import useChatSettings from '../hooks/use-chat-settings.js';
import {
	WAPUU_AGENT_ID,
	WAPUU_ASSISTANT_ID,
} from '../ai/agents/wapuu-agent.js';
import { ChatModelService, ChatModelType } from '../ai/chat-model.js';
import './chat-demo-ui.scss';
import useAgentsToolkit from '../hooks/use-agents-toolkit.js';
import useAnalyzeSiteToolkit from '../hooks/use-analyze-site-toolkit.js';
import useAgentExecutor from '../hooks/use-agent-executor.js';
import useSiteToolkit from '../hooks/use-site-toolkit.js';
import useGoalToolkit from '../hooks/use-goal-toolkit.js';
import useInformToolkit from '../hooks/use-inform-toolkit.js';
import withImplicitOauth from '../hooks/with-implicit-oauth.jsx';

/**
 * A chat UI that uses a "Chat Completions" endpoint that is powered by LangGraph.
 *
 * @param {Object}   root0                 The component props.
 * @param {string}   root0.apiKey          The token to use for the chat model.
 * @param {Function} root0.onApiKeyChanged Callback function to call when the token changes.
 * @param {string}   root0.service         The service to use for the chat model.
 * @param {string}   root0.wpcomOauthToken The token to use for the chat model.
 * @param {boolean}  root0.stream          Stream
 */
const ChatGraphUI = ( {
	apiKey,
	wpcomOauthToken,
	onApiKeyChanged,
	stream,
	service,
} ) => {
	const [ selectedPageId, setSelectedPageId ] = useState( null );

	useChatSettings( {
		apiKey: apiKey ?? wpcomOauthToken,
		stream,
		feature: 'big-sky-plugin',
		service: service ?? ChatModelService.WPCOM_GRAPH,
		model: ChatModelType.GPT_4O,
		initialAgentId: WAPUU_AGENT_ID,
		defaultAssistantId: WAPUU_ASSISTANT_ID,
	} );

	useAgentsToolkit();
	useSiteToolkit( { pageId: selectedPageId } );
	useAnalyzeSiteToolkit( { apiKey } );
	useGoalToolkit();
	useInformToolkit();
	useAgentExecutor();

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

				{ pages?.length > 0 && (
					<div className="big-sky__page-list-wrapper">
						<PageList
							pages={ pages }
							onSelectPage={ onSelectPage }
						/>
					</div>
				) }
			</Flex>
			<PopUpControls setApiKey={ onApiKeyChanged } />
		</>
	);
};

export const WPCOMChatGraph = withImplicitOauth( ChatGraphUI );

export default ChatGraphUI;
