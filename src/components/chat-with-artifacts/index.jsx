/**
 * WordPress dependencies
 */
import { useCallback, useState } from '@wordpress/element';
import { Flex } from '@wordpress/components';

/**
 * Internal dependencies
 */
import ChatHistory from '../chat-history.jsx';
import ArtifactList from './artifact-list.jsx';
import { useSelect } from '@wordpress/data';
import useChatSettings from '../../hooks/use-chat-settings.js';
import {
	AssistantModelService,
	AssistantModelType,
} from '../../ai/assistant-model.js';
import '../chat-demo-ui.scss';
import PopUpControls from '../popup-controls.jsx';
import useAgentExecutor from '../../hooks/use-agent-executor.js';
import useAgentsToolkit from '../../hooks/use-agents-toolkit.js';
import AskUserToolkit from '../../ai/toolkits/ask-user-toolkit.js';
import InformToolkit from '../../ai/toolkits/inform-toolkit.js';
import { useChat } from '../chat-provider';
import MessageInput from '../message-input.jsx';
import { useAgent } from '../agents-provider';
// for now, hack this in
import withImplicitOauth from '../../hooks/with-implicit-oauth.jsx';

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
 * @param {Object}   root0.user            The user object.
 * @param {string}   root0.wpcomOauthToken The WP.com OAuth token.
 * @param {Function} root0.onApiKeyChanged Callback function to call when the token changes.
 *                                         -->
 */
const ChatWithArtifacts = ( {
	baseUrl,
	apiKey,
	onApiKeyChanged,
	user,
	wpcomOauthToken,
} ) => {
	const [ selectedArtifactId, setSelectedArtifactId ] = useState( null );

	useChatSettings( {
		apiKey,
		feature: 'big-sky',
		assistantEnabled: true,
		service: AssistantModelService.LANGGRAPH_CLOUD,
		model: AssistantModelType.GPT_4O, // this is actually no longer relevant for graphs
		baseUrl,
		initialAgentId: GraphAgent.id,
		autoCreateAssistant: true,
		graphConfig: {
			user_id: user?.ID,
			user_name: user?.display_name,
			wpcom_access_token: wpcomOauthToken,
		},
	} );

	useAgent( GraphAgent );
	useAgentsToolkit();
	useAgentExecutor();

	const { assistantMessage, userSay, reset: onResetChat } = useChat();

	const [ userMessage, setUserMessage ] = useState( '' );

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
					<ChatHistory avatarUrl={ user?.avatar_URL } />
					<MessageInput
						disabled={ ! assistantMessage }
						value={ userMessage }
						onChange={ setUserMessage }
						onSubmit={ ( value, files ) => {
							userSay( value, files );
							setUserMessage( '' );
						} }
						onCancel={ () => {
							onResetChat();
						} }
						fileUploadEnabled={ true }
					/>
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
			<PopUpControls setApiKey={ onApiKeyChanged } />
		</>
	);
};

export const WPCOMChatWithArtifacts = withImplicitOauth( ChatWithArtifacts );

export default ChatWithArtifacts;
