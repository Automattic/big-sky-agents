import { useState } from '@wordpress/element';
import MessageInput from './message-input.jsx';
import useChat from './chat-provider/use-chat.js';

function UserMessageInput() {
	const [ userMessage, setUserMessage ] = useState( '' );
	const { userSay, reset, running } = useChat();
	return (
		<MessageInput
			disabled={ running }
			value={ userMessage }
			onChange={ setUserMessage }
			onSubmit={ ( value, files ) => {
				userSay( value, files );
				setUserMessage( '' );
			} }
			onCancel={ () => {
				reset();
				setUserMessage( '' );
			} }
			fileUploadEnabled={ true }
		/>
	);
}

export default UserMessageInput;
