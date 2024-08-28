/**
 * Internal dependencies
 */
import MessageContent from './message-content';
import useChat from './chat-provider/use-chat';
import { useEffect, useRef } from '@wordpress/element';
import { Notice, Spinner } from '@wordpress/components';
import './chat-history.scss';

function ChatHistory( { avatarUrl } ) {
	const { error, messages, toolOutputs, isThreadDataLoaded } = useChat();
	const chatHistoryRef = useRef( null );

	const scrollToBottom = () => {
		if ( chatHistoryRef.current ) {
			chatHistoryRef.current.scrollTop =
				chatHistoryRef.current.scrollHeight;
		}
	};

	useEffect( () => {
		scrollToBottom();
	}, [ messages, toolOutputs ] );

	return (
		<div className="big-sky__messages" ref={ chatHistoryRef }>
			{ error && <Notice status="error">{ error }</Notice> }
			{ ! isThreadDataLoaded && (
				<Notice>
					<Spinner />
					Loading History
				</Notice>
			) }
			{ messages
				?.filter( ( message ) =>
					[ 'user', 'assistant' ].includes( message.role )
				)
				.map( ( message, rowId ) => {
					return (
						<div
							key={ `chat-message-${ rowId }` }
							className={ `big-sky__messages-message big-sky__messages-message big-sky__messages-message-role-${ message.role }` }
						>
							{ message.role === 'user' && avatarUrl && (
								<img
									className="big-sky__messages-user-avatar"
									src={ avatarUrl }
									alt="User Avatar"
								/>
							) }

							<MessageContent content={ message.content || '' } />

							{ message.tool_calls?.map( ( tool_call, i ) => {
								const toolCallResult = toolOutputs.find(
									( toolOutput ) =>
										toolOutput.tool_call_id === tool_call.id
								);
								return (
									<div
										key={ `tool-call-${ i }` }
										className={ `big-sky__messages-tool-call big-sky__messages-tool-call-${
											toolCallResult
												? 'complete'
												: 'pending'
										}` }
									>
										⚙️ { tool_call.function.name }
										<pre>
											Request:
											<br />
											<br />
											{ JSON.stringify(
												tool_call.function.arguments,
												null,
												2
											) }
										</pre>
										{ toolCallResult ? (
											<pre>
												Result:
												<br />
												<br />
												{ ( () => {
													try {
														const parsedContent =
															JSON.parse(
																toolCallResult.output
															);
														return JSON.stringify(
															parsedContent,
															null,
															2
														);
													} catch ( e ) {
														return toolCallResult.output;
													}
												} )() }
											</pre>
										) : (
											' (pending)'
										) }
									</div>
								);
							} ) }
							{ message.created_at && (
								<div className="big-sky__messages-message-date">
									{ new Date(
										message.created_at * 1000
									).toLocaleString() }
								</div>
							) }
						</div>
					);
				} ) }
		</div>
	);
}

export default ChatHistory;
