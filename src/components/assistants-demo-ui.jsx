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
import {
	AssistantModelService,
	AssistantModelType,
} from '../agents/assistant-model.js';
import PageList from './page-list.jsx';
import useReduxToolkit from '../hooks/use-redux-toolkit.js';
import useCurrentAgent from '../hooks/use-current-agent.js';
import useAssistantExecutor from '../hooks/use-assistant-executor.js';
import { store as siteSpecStore } from '../store/index.js';
import { useSelect } from '@wordpress/data';
import useReduxChat from '../hooks/use-redux-chat.js';
import './agents-demo-ui.scss';

/**
 * An "Assistant" is just a server-side version of an Agent. We should probably come up with better names for these.
 *
 * This component displays the user interface for the Assistants Demo, which allows users to interact with assistants and preview generated content.
 * @param {Object}   root0                The component props.
 * @param {string}   root0.token          The token to use for the chat model.
 * @param {Function} root0.onTokenChanged Callback function to call when the token changes.
 */
const AgentsDemoUI = ( { token: originalToken, onTokenChanged } ) => {
	const [ controlsVisible, setControlsVisible ] = useState( false );
	const [ previewVisible, setPreviewVisible ] = useState( false );
	const [ model, setModel ] = useState( AssistantModelType.getDefault() );
	const [ service, setService ] = useState(
		AssistantModelService.getDefault()
	);
	const [ temperature, setTemperature ] = useState( 0.2 );
	const [ selectedPageId, setSelectedPageId ] = useState( null );
	const [ token, setToken ] = useState( originalToken );
	const feature = 'big-sky';

	// const chat = useSimpleChat( {
	// 	chatModel,
	// 	model,
	// 	temperature,
	// } );
	// const toolkit = useSimpleToolkit( { pageId: selectedPageId } );

	const chat = useReduxChat( {
		token,
		service,
		model,
		temperature,
		feature,
	} );
	const toolkit = useReduxToolkit( { token, pageId: selectedPageId } );

	const agent = useCurrentAgent( {
		pageId: selectedPageId,
		toolkit,
		chat,
	} );

	// run the agent
	useAssistantExecutor( {
		chat,
		agent,
		toolkit,
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
			{ controlsVisible && (
				<div className="big-sky__agent-debug">
					<AgentControls
						toolkit={ toolkit }
						agent={ agent }
						chat={ chat }
					/>
					<ChatModelControls
						token={ token }
						model={ model }
						service={ service }
						temperature={ temperature }
						onTokenChanged={ ( newToken ) => {
							setToken( newToken );
							if ( typeof onTokenChanged === 'function' ) {
								onTokenChanged( newToken );
							}
						} }
						onModelChanged={ setModel }
						onServiceChanged={ setService }
						onTemperatureChanged={ setTemperature }
					/>
				</div>
			) }
		</>
	);
};

export default AgentsDemoUI;
