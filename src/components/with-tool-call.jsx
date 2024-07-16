import useNextToolCall from '../hooks/use-next-tool-call.js';

const withToolCall = ( toolName, ChildComponent ) => {
	const ToolCall = ( props ) => {
		const { args, respond } = useNextToolCall( toolName );
		return (
			<ChildComponent { ...props } args={ args } respond={ respond } />
		);
	};

	return ToolCall;
};

export default withToolCall;
