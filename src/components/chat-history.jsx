/**
 * Internal dependencies
 */
import MessageContent from './message-content.jsx';

function ChatHistory( { history, toolOutputs } ) {
	return (
		<div className="big-sky__chat-history">
			{ history
				?.map( ( message, rowId ) => {
					return (
						<div
							key={ `chat-message-${ rowId }` }
							className={ `big-sky__chat-history-message big-sky__chat-history-message big-sky__chat-history-message-role-${ message.role }` }
						>
							{ [ 'user', 'assistant' ].includes(
								message.role
							) && (
								<MessageContent
									content={ message.content || '' }
								/>
							) }
							{ message.tool_calls && (
								<>
									Tool Calls
									{ message.tool_calls.map(
										( tool_call, i ) => {
											const toolCallResult =
												toolOutputs.find(
													( toolOutput ) =>
														toolOutput.id ===
														tool_call.id
												);
											return (
												<div
													key={ `tool-call-${ i }` }
													className="big-sky__chat-history-tool-call"
												>
													{ tool_call.function.name }(
													{ JSON.stringify(
														tool_call.function
															.arguments
													) }
													)
													{ toolCallResult ? (
														<>
															<br />
															<em>
																Response:
															</em>{ ' ' }
															{ JSON.stringify(
																toolCallResult
															) }
														</>
													) : (
														<>
															<br />
															<em>
																Waiting for
																response...
															</em>
														</>
													) }
												</div>
											);
										}
									) }{ ' ' }
								</>
							) }
							{ message.role === 'tool' && (
								<>
									ID: { message.tool_call_id }
									<br />
									Output:{ ' ' }
									{ JSON.stringify( message.content ) }
								</>
							) }
							<pre>{ JSON.stringify( message, null, 4 ) }</pre>
							<div className="big-sky__chat-history-message-date">
								{ new Date(
									message.created_at * 1000
								).toLocaleString() }
							</div>
						</div>
					);
				} )
				.reverse() }
		</div>
	);
}

export default ChatHistory;
