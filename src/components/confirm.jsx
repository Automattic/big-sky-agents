import { Button, Card, CardBody, CardFooter } from '@wordpress/components';
import { store as agentStore } from '../store/index.js';
import { useDispatch } from '@wordpress/data';

function Confirm( { toolCall, onConfirm } ) {
	const setToolCallResult = useDispatch( agentStore ).setToolCallResult;
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
							setToolCallResult(
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
							setToolCallResult(
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
