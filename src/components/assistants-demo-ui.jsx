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
import useToolkit from '../hooks/use-toolkit.js';
import { store as siteSpecStore } from '../store/index.js';
import { useSelect } from '@wordpress/data';
import useChat from './chat-provider/use-chat.js';
import useAgents from './agents-provider/use-agents.js';
import {
	AssistantModelService,
	AssistantModelType,
} from '../ai/assistant-model.js';
import { WAPUU_AGENT_ID } from '../ai/agents/wapuu-agent.js';
import './agents-demo-ui.scss';
import PopUpControls from './popup-controls.jsx';

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
const AssistantsDemoUI = ( { apiKey, onApiKeyChanged } ) => {
	const [ selectedPageId, setSelectedPageId ] = useState( null );

	useChat( {
		apiKey,
		feature: 'big-sky',
		assistantEnabled: true,
		service: AssistantModelService.OPENAI,
		model: AssistantModelType.GPT_4O,
	} );

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

export default AssistantsDemoUI;
