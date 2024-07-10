import { Button, Card, CardBody, CardFooter } from '@wordpress/components';
import MessageContent from './message-content.jsx';
import useNextToolCall from '../hooks/use-next-tool-call.js';
import { CONFIRM_TOOL_NAME } from '../ai/tools/confirm.js';
import useAgents from './agents-provider/use-agents.js';
import useToolkits from './toolkits-provider/use-toolkits.js';
import { useCallback } from 'react';

function Confirm( { onConfirm } ) {
	const { args, respond } = useNextToolCall( CONFIRM_TOOL_NAME );
	const { activeAgent } = useAgents();
	const { invoke } = useToolkits();

	const onSubmit = useCallback(
		( value ) => {
			respond(
				value ? 'The user confirmed' : 'The user did not confirm'
			);
			if ( onConfirm ) {
				onConfirm( value );
			}
			if ( activeAgent.onConfirm ) {
				activeAgent.onConfirm( value, invoke );
			}
		},
		[ activeAgent, onConfirm, respond, invoke ]
	);

	if ( ! args ) {
		return null;
	}

	const { message } = args;

	return (
		<div className="big-sky__agent-input">
			<Card size="medium">
				<CardBody className="big-sky__agent-input__header">
					<MessageContent
						content={
							message || 'Let me know if everything looks good'
						}
					/>
				</CardBody>
				<CardFooter>
					<Button
						variant="secondary"
						onClick={ () => {
							onSubmit( false );
						} }
					>
						Make Changes
					</Button>
					<Button
						variant="primary"
						onClick={ () => {
							onSubmit( true );
						} }
					>
						OK
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}

export default Confirm;
