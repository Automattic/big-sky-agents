/**
 * External dependencies
 */
import Markdown from 'react-markdown';

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
import ToolNotices from './tool-notices.jsx';
import { ASK_USER_TOOL_NAME } from '../agents/tools/ask-user.js';
import { INFORM_TOOL_NAME } from '../agents/tools/inform-user.js';
import { CONFIRM_TOOL_NAME } from '../agents/tools/confirm.js';

const AgentMessage = ( { message, isActive = true, ...props } ) =>
	isActive && (
		<div { ...props }>
			<blockquote className="big-sky__oval-thought big-sky__agent-thought">
				<Markdown>{ message }</Markdown>
			</blockquote>
		</div>
	);

const AgentQuestion = ( { question, children, ...props } ) => (
	<div { ...props }>
		<blockquote className="big-sky__oval-speech big-sky__agent-question">
			<Markdown>{ question }</Markdown>
		</blockquote>
		{ children }
	</div>
);

const AgentThinking = ( { running, toolRunning, ...props } ) => (
	<div { ...props }>
		<div
			className={ `big-sky__agent-thinking ${
				running ? 'big-sky__agent-thinking-running' : ''
			} ${ toolRunning ? 'big-sky__agent-thinking-tool-running' : '' }` }
		></div>
	</div>
);

const getNextPendingRequest = ( pendingToolRequests, toolName ) => {
	return pendingToolRequests?.find(
		( request ) => request.function.name === toolName
	);
};

function AgentUI( {
	chat: {
		error,
		running,
		toolRunning,
		agentMessage,
		pendingToolRequests,
		userSay,
		setToolCallResult,
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
				pendingToolRequests,
				ASK_USER_TOOL_NAME
			),
			agentConfirm: getNextPendingRequest(
				pendingToolRequests,
				CONFIRM_TOOL_NAME
			),
		};
	}, [ pendingToolRequests ] );

	return (
		<div
			className={ `big-sky__agent-ui big-sky__agent-ui-${
				running ? 'active' : 'inactive'
			}` }
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
									setToolCallResult(
										agentQuestion.id,
										'(canceled)'
									);
									onResetTools();
									onResetChat();
								} }
								onAnswer={ ( answer, files ) => {
									// clear the current thought
									setAgentThought( { message: null } );
									setToolCallResult(
										agentQuestion.id,
										answer
									);
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
								onConfirm={ onConfirm }
							/>
						</AgentQuestion>
					) }
					{ ! agentMessage && ! agentQuestion && ! agentConfirm && (
						<AgentThinking
							running={ running }
							toolRunning={ toolRunning }
						/>
					) }
					<ToolNotices />
				</FlexBlock>
			</Flex>
		</div>
	);
}

export default AgentUI;
