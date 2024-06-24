import { Button, Card, CardBody, CardFooter } from '@wordpress/components';
import MessageContent from './message-content.jsx';

function Confirm( { message, onConfirm } ) {
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
							onConfirm( false );
						} }
					>
						Make Changes
					</Button>
					<Button
						variant="primary"
						onClick={ () => {
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
