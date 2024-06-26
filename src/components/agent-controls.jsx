/**
 * WordPress dependencies
 */
import {
	BaseControl,
	Button,
	__experimentalHStack as HStack,
	SelectControl,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import './agent-controls.scss';

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

const AgentControls = ( { agent, toolkit, chat } ) => {
	const {
		threadId,
		assistantId,
		onReset: onResetChat,
		running,
		enabled,
		setEnabled,
		createThread,
		deleteThread,
		createThreadRun,
		updateThreadRun,
		updateThreadRuns,
		updateThreadMessages,
		threadRun,
	} = chat;

	const {
		onReset: onResetToolkit,
		values: {
			agents,
			agent: { id: agentId, goal: agentGoal },
		},
		callbacks: { setAgent, setAgentGoal },
	} = toolkit;

	return (
		<div className="big-sky__agent-controls">
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
								backgroundColor: enabled
									? '#bbffbb'
									: '#ffbbbb',
								color: enabled ? '#000' : '#ff0000',
							} }
							onClick={ () => setEnabled( ! enabled ) }
						>
							{ enabled ? 'Enabled' : 'Disabled' }
						</Button>
						<RunningIndicator
							running={ running }
							enabled={ enabled }
						/>
					</span>
				</BaseControl>
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
								<br />
								<button
									disabled={ running }
									onClick={ () => updateThreadMessages() }
								>
									refresh messages
								</button>
								<button
									disabled={ running }
									onClick={ () => deleteThread() }
								>
									delete
								</button>
							</>
						) : (
							<button onClick={ () => createThread() }>
								create
							</button>
						) }
					</span>
				</BaseControl>
				<BaseControl
					id={ 'assistant-run-control' }
					label="Assistant Run"
					labelPosition="side"
				>
					<span className="big-sky__assistant-run-indicator">
						{ threadRun ? (
							<>
								{ threadRun.id } { threadRun.status }
								<br />
								<button
									disabled={ running }
									onClick={ () => updateThreadRun() }
								>
									refresh
								</button>
								<button
									disabled={ running }
									onClick={ () => createThreadRun() }
								>
									start
								</button>
							</>
						) : (
							<>
								<button
									disabled={ running }
									onClick={ () => updateThreadRuns() }
								>
									refresh
								</button>
								<button
									disabled={ running }
									onClick={ () => createThreadRun() }
								>
									start
								</button>
							</>
						) }
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
									setAgentGoal( { goal: null } );
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
					value={ agentId ?? '' }
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
						setAgent( { agentId: newAgentId } );
					} }
				/>
				<HStack align="center">
					<Button
						style={ { width: '100%' } }
						variant="primary"
						onClick={ () => agent.onStart() }
					>
						Start
					</Button>
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
			</VStack>
		</div>
	);
};

export default AgentControls;
