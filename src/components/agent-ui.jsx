/**
 * WordPress dependencies
 */
import { Flex, FlexBlock, Notice } from '@wordpress/components';
import { useMemo } from 'react';

/**
 * Internal dependencies
 */
import AskUserQuestion from './ask-question.jsx';
import Confirm from './confirm.jsx';
import MessageContent from './message-content.jsx';
import { ASK_USER_TOOL_NAME } from '../ai/tools/ask-user.js';
import { CONFIRM_TOOL_NAME } from '../ai/tools/confirm.js';
import useChat from './chat-provider/use-chat.js';
// import useToolkits from './toolkits-provider/use-toolkits.js';
// import useTools from './tools-provider/use-tools.js';
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

const getNextPendingRequest = ( pendingToolCalls, toolName ) => {
	return pendingToolCalls?.find(
		( request ) => request.function.name === toolName
	);
};

function AgentUI() {
	const {
		name: agentName,
		// goal: agentGoal,
		thought: agentThought,
	} = useAgents();
	// console.warn( 'agents', agents );
	// useAgentToolkit();
	// const {
	// 	context: {
	// 		agent: { name: agentName, thought: agentThought },
	// 	},
	// } = useToolkits( [ 'agents' ] );
	// const agentName = 'Agent';
	// const agentThought = 'Help the user find out about the weather';

	// const toolkits = useToolkits( [ 'agents' ] );
	// console.warn( 'toolkits', toolkits );
	const informUser = ( message ) => {
		console.warn( '🚀 Informing user', message );
	};

	const {
		error,
		enabled,
		loading,
		running,
		toolRunning,
		assistantMessage,
		pendingToolCalls,
		userSay,
		setToolResult,
		onReset: onResetChat,
	} = useChat();

	const { agentQuestion, agentConfirm } = useMemo( () => {
		return {
			agentQuestion: getNextPendingRequest(
				pendingToolCalls,
				ASK_USER_TOOL_NAME
			),
			agentConfirm: getNextPendingRequest(
				pendingToolCalls,
				CONFIRM_TOOL_NAME
			),
		};
	}, [ pendingToolCalls ] );

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
							{ ! agentQuestion && ! agentConfirm ? (
								<AskUserQuestion
									onAnswer={ ( answer, files ) => {
										userSay( answer, files );
									} }
									onCancel={ () => {
										informUser( 'Canceled!' );
										// onResetTools();
										onResetChat();
									} }
								/>
							) : null }
						</AgentMessage>
					) }
					{ agentQuestion && (
						<AskUserQuestion
							{ ...agentQuestion.function.arguments }
							onCancel={ () => {
								setToolResult( agentQuestion.id, '(canceled)' );
								// onResetTools();
								onResetChat();
							} }
							onAnswer={ ( answer, files ) => {
								// clear the current thought
								informUser( {} );
								setToolResult( agentQuestion.id, answer );
								userSay( answer, files );
							} }
						/>
					) }
					{ agentConfirm && (
						<Confirm
							{ ...agentConfirm.function.arguments }
							onConfirm={ ( confirmed ) => {
								informUser( {} );
								setToolResult(
									agentConfirm.id,
									confirmed
										? 'The user confirmed the proposed changes'
										: 'The user rejected the proposed changes'
								);
								// TODO:
								// onConfirm( confirmed );
							} }
						/>
					) }
					{ /* fallback if nothing else is showing */ }
					{ ! assistantMessage &&
						! agentQuestion &&
						! agentConfirm && (
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
