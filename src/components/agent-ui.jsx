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
import { ASK_USER_TOOL_NAME } from '../agents/tools/ask-user.js';
import { INFORM_TOOL_NAME } from '../agents/tools/inform-user.js';
import { CONFIRM_TOOL_NAME } from '../agents/tools/confirm.js';
import './agent-ui.scss';

const AgentMessage = ( { message, isActive = true, ...props } ) =>
	isActive && (
		<div { ...props }>
			<blockquote className="big-sky__oval-thought big-sky__agent-thought">
				<MessageContent content={ message } />
			</blockquote>
		</div>
	);

const AgentQuestion = ( { question, children, ...props } ) => (
	<div { ...props }>
		<blockquote className="big-sky__oval-speech big-sky__agent-question">
			<MessageContent content={ question } />
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

function AgentUI( {
	chat: {
		error,
		enabled,
		loading,
		running,
		toolRunning,
		agentMessage,
		pendingToolCalls,
		userSay,
		setToolResult,
		onReset: onResetChat,
	},
	agent: { onConfirm, onStart: onAgentStart },
	toolkit: {
		onReset: onResetTools,
		values: { agentName, agentThought },
		callbacks: { [ INFORM_TOOL_NAME ]: setAgentThought },
	},
} ) {
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
						onAgentStart();
					} }
				>
					{ error }
				</Notice>
			) }
			<Flex align="flex-start" justify="stretch">
				<FlexBlock className="big-sky__agent-ui-content">
					<div className="big-sky__agent-name">{ agentName }</div>

					{ agentThought && (
						<AgentMessage
							message={ agentThought }
							isActive={
								! agentQuestion &&
								! agentConfirm &&
								! agentMessage
							}
						/>
					) }
					{ agentMessage && (
						<AgentQuestion question={ agentMessage }>
							<AskUserQuestion
								question=""
								onCancel={ () => {
									userSay( '(canceled)' );
									onResetTools();
									onResetChat();
								} }
								onAnswer={ ( answer, files ) => {
									userSay( answer, files );
								} }
							/>
						</AgentQuestion>
					) }
					{ agentQuestion && (
						<AgentQuestion
							question={
								agentQuestion.function.arguments.question
							}
						>
							<AskUserQuestion
								{ ...agentQuestion.function.arguments }
								question=""
								onCancel={ () => {
									setToolResult(
										agentQuestion.id,
										'(canceled)'
									);
									onResetTools();
									onResetChat();
								} }
								onAnswer={ ( answer, files ) => {
									// clear the current thought
									setAgentThought( { message: null } );
									setToolResult( agentQuestion.id, answer );
									userSay( answer, files );
								} }
							/>
						</AgentQuestion>
					) }
					{ agentConfirm && (
						<AgentQuestion
							question={ agentConfirm.function.arguments.message }
						>
							<Confirm
								toolCall={ agentConfirm }
								onConfirm={ ( confirmed ) => {
									setAgentThought( { message: null } );
									setToolResult( agentConfirm.id, confirmed );
									onConfirm( confirmed );
								} }
							/>
						</AgentQuestion>
					) }
					{ ! agentMessage && ! agentQuestion && ! agentConfirm && (
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
