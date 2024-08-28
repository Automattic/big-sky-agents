/**
 * WordPress dependencies
 */
import {
	BaseControl,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import './tool-call-controls.scss';
import useChat from './chat-provider/use-chat.js';
import MessageContent from './message-content.jsx';

const ToolCallControls = () => {
	const { pendingToolCalls, assistantMessage } = useChat();
	return (
		<div className="big-sky__tool-call-controls">
			<VStack>
				{ assistantMessage && (
					<BaseControl
						id={ 'assistant-message' }
						label="Assistant Message"
						labelPosition="side"
					>
						<div className="big-sky__assistant-message">
							<MessageContent content={ assistantMessage } />
						</div>
					</BaseControl>
				) }
				{ pendingToolCalls.map( ( toolCall, index ) => (
					<BaseControl
						id={ `tool-call-${ index }` }
						key={ `tool-call-${ index }` }
						label={ toolCall.function.name }
						labelPosition="side"
					>
						<span className="big-sky__tool-call-message">
							<pre>
								{ JSON.stringify(
									toolCall.function.arguments,
									null,
									2
								) }
							</pre>
						</span>
					</BaseControl>
				) ) }
			</VStack>
		</div>
	);
};

export default ToolCallControls;
