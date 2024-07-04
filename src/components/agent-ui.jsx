/**
 * WordPress dependencies
 */
import { Flex, FlexBlock, Notice } from '@wordpress/components';

/**
 * Internal dependencies
 */
import AskUserComponent from './ask-user.jsx';
import ConfirmComponent from './confirm.jsx';
import MessageContent from './message-content.jsx';
import UserMessageInput from './user-message-input.jsx';
import useChat from './chat-provider/use-chat.js';
import useAgents from './agents-provider/use-agents.js';
import './agent-ui.scss';

const AgentThought = ( { message, ...props } ) => (
	<div { ...props }>
		<blockquote className="big-sky__oval-thought big-sky__agent-thought">
			<MessageContent content={ message } />
		</blockquote>
	</div>
);

const AgentMessage = ( { message, children, ...props } ) => (
	<div { ...props }>
		<blockquote className="big-sky__oval-speech big-sky__agent-question">
			<MessageContent content={ message } />
		</blockquote>
		{ children }
	</div>
);

const AgentThinking = ( {
	running,
	toolRunning,
	loading,
	enabled,
	...props
} ) => (
	<div { ...props }>
		<div
			className={ `big-sky__agent-thinking ${
				running ? 'big-sky__agent-thinking-running' : ''
			} ${ toolRunning ? 'big-sky__agent-thinking-tool-running' : '' } ${
				enabled
					? 'big-sky__agent-thinking-enabled'
					: 'big-sky__agent-thinking-disabled'
			} ${
				loading
					? 'big-sky__agent-thinking-loading'
					: 'big-sky__agent-thinking-loaded'
			}` }
		></div>
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
		enabled,
		loading,
		running,
		toolRunning,
		assistantMessage,
		userSay,
		pendingToolRequests,
		reset: onResetChat,
	} = useChat();

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

					{ agentThought && (
						<AgentThought message={ agentThought } />
					) }
					{ assistantMessage && (
						<AgentMessage message={ assistantMessage }>
							<UserMessageInput
								onSubmit={ userSay }
								onCancel={ () => {
									informUser( 'Canceled!' );
									// onResetTools();
									onResetChat();
								} }
								fileUploadEnabled={ false }
							/>
						</AgentMessage>
					) }
					<AskUserComponent />
					<ConfirmComponent />
					{ ! assistantMessage &&
						pendingToolRequests.length === 0 && (
							<AgentThinking
								enabled={ enabled }
								loading={ loading }
								running={ running }
								toolRunning={ toolRunning }
							/>
						) }
				</FlexBlock>
			</Flex>
		</div>
	);
}

export default AgentUI;
