/**
 * WordPress dependencies
 */
import { Button, Modal } from '@wordpress/components';

/**
 * Internal dependencies
 */
import useChat from './chat-provider/use-chat.js';

function EvalPopup( { context, onClose = () => {} } ) {
	const { messages } = useChat();

	const jsonToJsObject = ( json ) => {
		// Convert the object back to a formatted string representing the object in JS syntax
		const jsCode = JSON.stringify( json, null, 4 ).replace(
			/"([^"]+)":/g,
			'$1:'
		); // Remove quotes from keys

		return jsCode;
	};

	const formatMessages = () => {
		const messageList = [];
		messages.every( ( message ) => {
			switch ( message.role ) {
				case 'user':
					messageList.push(
						`.user( '${ message.content[ 0 ].text }' )`
					);
					break;
				case 'assistant':
					if ( ! message.content ) {
						if ( message.tool_calls ) {
							message.tool_calls.forEach( ( tool_call ) => {
								messageList.push(
									`.expectToolCall( '${
										tool_call.function.name
									}', ${ jsonToJsObject(
										tool_call.function.arguments
									) } )`
								);
							} );
							return false;
						}
						return true;
					}

					// if this is the last message, it's the expected message
					if ( message === messages[ messages.length - 1 ] ) {
						messageList.push(
							`.expect( '${
								message.content?.[ 0 ]?.text || message.content
							}' )`
						);
					} else {
						messageList.push(
							`.assistant( '${
								message.content?.[ 0 ]?.text || message.content
							}' )`
						);
					}
			}
			return true;
		} );
		return messageList.filter( ( message ) => message ).join( '\n' );
	};

	const handleCopy = () => {
		navigator.clipboard
			.writeText( codeToCopy )
			.then( () => {
				console.log( 'Code copied to clipboard!' );
			} )
			.catch( ( err ) => {
				console.error( 'Failed to copy code: ', err );
			} );
	};

	const codeToCopy = `
import {
	AgentExampleBuilder,
	IGNORE,
	// eslint-disable-next-line import/no-unresolved
} from '@automattic/big-sky-agents/eval';

const builder = new AgentExampleBuilder();
const data = {
	name: '<ADD NAME>',
	description: '<ADD DESCRIPTION>',
	data: [
		builder()
			.description( '<ADD TEST DESCRIPTION>' )
			.context( ${ jsonToJsObject( context ) } )
			${ formatMessages() }
			.toJSON(),
	],
	evaluators: [
		{
			key: 'match_tool_call',
			description: 'If a tool call is expected, does it match?',
			function: 'chat:matchToolCall',
		},
		{
			key: 'match_message_content',
			description: 'If a message content is expected, does it match?',
			function: 'chat:compareContent',
		},
	],
};

export default data;
`;

	return (
		<Modal onRequestClose={ onClose } title="Evaluation code">
			<Button isPrimary onClick={ handleCopy }>
				Copy
			</Button>
			<code
				className="big-sky__eval-builder"
				style={ {
					whiteSpace: 'pre-wrap',
					backgroundColor: 'transparent',
				} }
			>
				{ codeToCopy }
			</code>
		</Modal>
	);
}

export default EvalPopup;
