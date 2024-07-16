import { Button, Card, CardBody, CardFooter } from '@wordpress/components';
import MessageContent from './message-content.jsx';
import { CONFIRM_TOOL_NAME } from '../ai/tools/confirm.js';
import { useCallback } from 'react';
import withToolCall from './with-tool-call.jsx';

function Confirm( { args, respond, onConfirm } ) {
	const onSubmit = useCallback(
		( value ) => {
			respond(
				value,
				value
					? 'The user confirmed the changes'
					: 'The user rejected the changes'
			);
			if ( onConfirm ) {
				onConfirm( value );
			}
		},
		[ onConfirm, respond ]
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
						onClick={ () => onSubmit( false ) }
					>
						Make Changes
					</Button>
					<Button
						variant="primary"
						onClick={ () => onSubmit( true ) }
					>
						OK
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}

export default withToolCall( CONFIRM_TOOL_NAME, Confirm );
