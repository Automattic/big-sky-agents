import { useCallback, useMemo } from '@wordpress/element';
import useChat from '../components/chat-provider/use-chat.js';
import useToolkits from '../components/toolkits-provider/use-toolkits.js';
import useAgents from '../components/agents-provider/use-agents.js';

const useNextToolCall = ( toolName ) => {
	const { pendingToolCalls, setToolResult } = useChat();
	const toolCall = useMemo(
		() =>
			pendingToolCalls?.find(
				( request ) => request.function.name === toolName
			),
		[ pendingToolCalls, toolName ]
	);
	const { callbacks } = useToolkits();
	const { activeAgent } = useAgents();

	const respond = useCallback(
		( value, toolResponse ) => {
			setToolResult( toolCall.id, toolResponse ?? value );
			if ( activeAgent.onToolResult ) {
				activeAgent.onToolResult( toolCall, value, callbacks );
			}
		},
		[ setToolResult, toolCall, activeAgent, callbacks ]
	);

	return {
		args: toolCall?.function?.arguments,
		respond,
	};
};

export default useNextToolCall;
