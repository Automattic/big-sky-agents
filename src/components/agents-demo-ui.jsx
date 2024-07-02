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
import PopUpControls from './popup-controls.jsx';
import ChatHistory from './chat-history.jsx';
import PageList from './page-list.jsx';
import { store as siteSpecStore } from '../store/index.js';
import { useSelect } from '@wordpress/data';
import useChatSettings from '../hooks/use-chat-settings.js';
import useAgents from './agents-provider/use-agents.js';
import { WAPUU_AGENT_ID } from '../ai/agents/wapuu-agent.js';
import { ChatModelService, ChatModelType } from '../ai/chat-model.js';
import './agents-demo-ui.scss';
import useAgentToolkit from '../hooks/use-agent-toolkit.js';
import useAnalyzeSiteToolkit from '../hooks/use-analyze-site-toolkit.js';
import useAgentExecutor from '../hooks/use-agent-executor.js';
import useSiteToolkit from '../hooks/use-site-toolkit.js';

/**
 * Renders the Agents Demo UI component.
 *
 * This component displays the user interface for the Agents Demo, which allows users to interact with agents and preview generated content.
 * <!--
 * @param {Object}   root0                 The component props.
 * @param {string}   root0.apiKey          The token to use for the chat model.
 * @param {Function} root0.onApiKeyChanged Callback function to call when the token changes.
 *                                         -->
 */
const AgentsDemoUI = ( { apiKey, onApiKeyChanged } ) => {
	const [ selectedPageId, setSelectedPageId ] = useState( null );

	useChatSettings( {
		apiKey,
		feature: 'big-sky',
		service: ChatModelService.OPENAI,
		model: ChatModelType.GPT_4O,
	} );

	useAgentToolkit();
	useSiteToolkit( { pageId: selectedPageId } );
	useAnalyzeSiteToolkit( { apiKey } );
	useAgentExecutor();

	const { setActiveAgent } = useAgents();

	// set the initial agent
	useEffect( () => {
		setActiveAgent( WAPUU_AGENT_ID );
	}, [ setActiveAgent ] );

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
			<ChatHistory />
			<PopUpControls setApiKey={ onApiKeyChanged } />
		</>
	);
};

export default AgentsDemoUI;
