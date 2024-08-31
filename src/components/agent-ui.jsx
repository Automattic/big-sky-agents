/**
 * WordPress dependencies
 */
import { Flex, FlexBlock, Notice } from '@wordpress/components';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import AskUserComponent from './ask-user.jsx';
import ConfirmComponent from './confirm.jsx';
import MessageContent from './message-content.jsx';
import MessageInput from './message-input.jsx';
import useChat from './chat-provider/use-chat.js';
import useAgents from './agents-provider/use-agents.js';
import './agent-ui.scss';
import ChatHistory from './chat-history.jsx';

const AgentThought = ( { message, ...props } ) => (
	<div { ...props }>
		<blockquote className="big-sky__oval-thought big-sky__agent-thought">
			<MessageContent content={ message } />
		</blockquote>
	</div>
);

function AgentUI() {
	const {
		name: agentName,
		thought: agentThought,
		setAgentThought: informUser,
	} = useAgents();

	const {
		error,
		loading,
		running,
		assistantMessage,
		userSay,
		reset: onResetChat,
	} = useChat();

	const [ userMessage, setUserMessage ] = useState( '' );
	return (
		<div
			className={ `big-sky__agent-ui big-sky__agent-ui-${
				running ? 'active' : 'inactive'
			} big-sky__agent-ui-${ loading ? 'loading' : 'loaded ' }` }
		>
			{ error && (
				<Notice
					status="error"
					isDismissible={ true }
					onRemove={ () => {
						onResetChat();
					} }
				>
					{ error }
				</Notice>
			) }

			<Flex align="flex-start" justify="stretch">
				<FlexBlock className="big-sky__agent-ui-content">
					<div className="big-sky__agent-name">{ agentName }</div>
					<ChatHistory />
					{ agentThought && (
						<AgentThought message={ agentThought } />
					) }
					<AskUserComponent />
					<ConfirmComponent />
					<MessageInput
						disabled={ ! assistantMessage }
						value={ userMessage }
						onChange={ setUserMessage }
						onSubmit={ ( value, files ) => {
							userSay( value, files );
							setUserMessage( '' );
						} }
						onCancel={ () => {
							informUser( 'Canceled!' );
							onResetChat();
						} }
						fileUploadEnabled={ true }
					/>
				</FlexBlock>
			</Flex>
		</div>
	);
}

export default AgentUI;
