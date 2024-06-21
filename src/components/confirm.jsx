import { Button, Card, CardBody, CardFooter } from '@wordpress/components';

function Confirm( { toolCall, onConfirm, setToolResult } ) {
	const message = toolCall.function.arguments.message;

	return (
		<div className="big-sky__agent-input">
			<Card size="medium">
				{ message && (
					<CardBody>
						{ message || 'Let me know if everything looks good' }
					</CardBody>
				) }
				<CardFooter>
					<Button
						variant="secondary"
						onClick={ () => {
							setToolResult(
								toolCall.id,
								`The user rejected the proposed changes`
							);
							onConfirm( false );
						} }
					>
						Make Changes
					</Button>
					<Button
						variant="primary"
						onClick={ () => {
							setToolResult(
								toolCall.id,
								`The user confirmed the proposed changes`
							);
							onConfirm( true );
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
