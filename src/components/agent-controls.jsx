/**
 * WordPress dependencies
 */
import {
	BaseControl,
	Button,
	FormToggle,
	__experimentalHStack as HStack,
	Icon,
	SelectControl,
	Tooltip,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { create, starFilled, trash, update } from '@wordpress/icons';
import './agent-controls.scss';
import useAgents from './agents-provider/use-agents.js';
import useChat from './chat-provider/use-chat.js';
import useToolkits from './toolkits-provider/use-toolkits.js';

const RunningIndicator = ( { running, enabled } ) => {
	return (
		<span
			style={ {
				paddingLeft: 8,
				opacity: enabled ? 1 : 0.5,
			} }
		>
			{ running ? '🧠' : '💤' }
		</span>
	);
};

const AssistantAgentControls = () => {
	const {
		threadId,
		assistantId,
		running,
		createThread,
		deleteThread,
		updateThreadRuns,
		threadRun,
		reset: onResetChat,
	} = useChat();

	return (
		<VStack>
			<BaseControl
				id={ 'assistant-control' }
				label="Assistant"
				labelPosition="side"
			>
				<span className="big-sky__assistant-indicator">
					{ assistantId ?? 'None' }
				</span>
			</BaseControl>
			<BaseControl
				id={ 'thread-control' }
				label="Thread"
				labelPosition="side"
			>
				<span className="big-sky__thread-indicator">
					{ threadId ? (
						<>
							{ threadId }
							<Button
								icon={ <Icon icon={ trash } /> }
								disabled={ running }
								onClick={ () => {
									deleteThread();
									onResetChat();
								} }
							/>
						</>
					) : (
						<Button
							icon={ <Icon icon={ create } /> }
							disabled={ running }
							onClick={ () => createThread() }
						/>
					) }
				</span>
			</BaseControl>
			<BaseControl
				id={ 'assistant-run-control' }
				label="Thread Run"
				labelPosition="side"
			>
				<span className="big-sky__assistant-run-indicator">
					{ threadRun && (
						<>
							{ threadRun.id } { threadRun.status }
						</>
					) }{ ' ' }
					<Button
						icon={ <Icon icon={ update } /> }
						disabled={ running || ! threadId }
						onClick={ () => updateThreadRuns() }
					/>
				</span>
			</BaseControl>
		</VStack>
	);
};

const ChatAgentControls = () => {
	const {
		goal: agentGoal,
		agents,
		activeAgent,
		setActiveAgent,
		setAgentStarted,
	} = useAgents();
	const {
		reset: onResetChat,
		running,
		enabled,
		setEnabled,
		isThreadRunInProgress,
		isThreadDataLoaded,
		isThreadRunComplete,
		isAwaitingUserInput,
		isAvailable,
		isAssistantAvailable,
	} = useChat();
	const { reset: onResetToolkit } = useToolkits();

	// const {
	// 	reset: onResetToolkit,
	// 	context: {
	// 		agent: { goal: agentGoal },
	// 	},
	// } = useToolkits( [ 'agents' ] );
	return (
		<VStack>
			<BaseControl
				id={ 'status-control' }
				label="Status"
				labelPosition="side"
			>
				<span className="big-sky__agent-running-indicator">
					<Button
						variant="secondary"
						size="small"
						style={ {
							backgroundColor: enabled ? '#bbffbb' : '#ffbbbb',
							color: enabled ? '#000' : '#ff0000',
						} }
						onClick={ () => setEnabled( ! enabled ) }
					>
						{ enabled ? 'Enabled' : 'Disabled' }
					</Button>
					<RunningIndicator running={ running } enabled={ enabled } />
				</span>
			</BaseControl>
			<BaseControl
				id={ 'goal-control' }
				label="Goal"
				labelPosition="side"
			>
				<span className="big-sky__goal-indicator">
					{ agentGoal ?? 'None' }
					{ agentGoal && (
						<Button
							size="small"
							onClick={ () => {
								onResetChat();
								onResetToolkit();
							} }
						>
							Reset
						</Button>
					) }
				</span>
			</BaseControl>
			<SelectControl
				label="Agent"
				labelPosition="side"
				value={ activeAgent?.id ?? '' }
				options={ [
					...agents.map( ( anAgent ) => {
						return {
							label: anAgent.name,
							value: anAgent.id,
						};
					} ),
					{
						label: 'None',
						value: '',
					},
				] }
				onChange={ ( newAgentId ) => {
					onResetChat();
					onResetToolkit();
					setActiveAgent( newAgentId );
					setAgentStarted( false );
				} }
			/>
			<HStack align="center">
				<Button
					style={ { width: '100%' } }
					variant="secondary"
					onClick={ () => onResetChat() }
				>
					Reset Chat
				</Button>
				<Button
					style={ { width: '100%' } }
					variant="secondary"
					onClick={ () => onResetToolkit() }
				>
					Reset Toolkit
				</Button>
			</HStack>
			{ /* list out isThreadRunInProgress,
		isThreadDataLoaded,
		isThreadRunComplete,
		isAwaitingUserInput,
		isAvailable,
		isChatAvailable,
		isAssistantAvailable in a simple list with labels */ }
			<div>
				<Tooltip text="Running">
					<Icon
						icon={ starFilled }
						style={ {
							fill: running ? 'orange' : 'green',
						} }
					/>
				</Tooltip>
				<Tooltip text="Available">
					<Icon
						icon={ starFilled }
						style={ {
							fill: isAvailable ? 'green' : 'gray',
						} }
					/>
				</Tooltip>
				<Tooltip text="Chat Available">
					<Icon
						icon={ starFilled }
						style={ {
							fill: isAvailable ? 'green' : 'gray',
						} }
					/>
				</Tooltip>
				<Tooltip text="Assistant Available">
					<Icon
						icon={ starFilled }
						style={ {
							fill: isAssistantAvailable ? 'green' : 'gray',
						} }
					/>
				</Tooltip>
				<Tooltip text="Thread Data Loaded">
					<Icon
						icon={ starFilled }
						style={ {
							fill: isThreadDataLoaded ? 'green' : 'orange',
						} }
					/>
				</Tooltip>
				<Tooltip text="Thread Run In Progress">
					<Icon
						icon={ starFilled }
						style={ {
							fill: isThreadRunInProgress ? 'orange' : 'green',
						} }
					/>
				</Tooltip>
				<Tooltip text="Thread Run Complete">
					<Icon
						icon={ starFilled }
						style={ {
							fill: isThreadRunComplete ? 'green' : 'orange',
						} }
					/>
				</Tooltip>
				<Tooltip text="Awaiting User Input">
					<Icon
						icon={ starFilled }
						style={ {
							fill: isAwaitingUserInput ? 'green' : 'orange',
						} }
					/>
				</Tooltip>
			</div>
		</VStack>
	);
};

const AgentControls = () => {
	const { assistantEnabled, setAssistantEnabled, stream, setStream } =
		useChat();
	return (
		<div className="big-sky__agent-controls">
			<ChatAgentControls />
			{ assistantEnabled && <AssistantAgentControls /> }
			<BaseControl
				id={ 'assistant-enabled-control' }
				label="Assistant"
				labelPosition="side"
			>
				<span className="big-sky__assistant-enabled">
					<FormToggle
						checked={ assistantEnabled }
						onClick={ () =>
							setAssistantEnabled( ! assistantEnabled )
						}
					/>{ ' ' }
					{ assistantEnabled ? 'Enabled' : 'Disabled' }
					<FormToggle
						checked={ stream }
						onClick={ () => setStream( ! stream ) }
					/>{ ' ' }
					{ stream ? 'Stream' : 'Poll' }
				</span>
			</BaseControl>
		</div>
	);
};

export default AgentControls;
