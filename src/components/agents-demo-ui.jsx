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
import useReduxToolkit from '../hooks/use-redux-toolkit.js';
import useChatExecutor from '../hooks/use-chat-executor.js';
import { store as siteSpecStore } from '../store/index.js';
import { useSelect } from '@wordpress/data';
import useChat from './chat-provider/use-chat.js';
import './agents-demo-ui.scss';

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

	useChat( { apiKey, feature: 'big-sky' } );

	const toolkit = useReduxToolkit( {
		apiKey,
		pageId: selectedPageId,
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

	return (
		<>
			<Flex direction="row" align="stretch" justify="center">
				<div className="big-sky__agent-column">
					<AgentUI toolkit={ toolkit } />
				</div>
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

export default AgentsDemoUI;
