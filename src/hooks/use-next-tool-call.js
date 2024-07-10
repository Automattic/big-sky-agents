import { useCallback, useMemo } from '@wordpress/element';
import useChat from '../components/chat-provider/use-chat.js';

const useNextToolCall = ( toolName ) => {
	const { pendingToolCalls, setToolResult } = useChat();
	const toolCall = useMemo(
		() =>
			pendingToolCalls?.find(
				( request ) => request.function.name === toolName
			),
		[ pendingToolCalls, toolName ]
	);

	const respond = useCallback(
		( value, toolResponse ) => {
			setToolResult( toolCall.id, toolResponse ?? value );
		},
		[ setToolResult, toolCall ]
	);

	return {
		args: toolCall?.function?.arguments,
		respond,
	};
};

export default useNextToolCall;
