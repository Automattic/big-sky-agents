/* eslint-disable camelcase, no-console */
import { useEffect } from 'react';

const useToolExecutor = ( {
	chat: { running, pendingToolCalls, setToolResult },
	toolkit: { callbacks },
} ) => {
	useEffect( () => {
		// process tool calls for any tools with callbacks
		// note that tools without callbacks will be processed outside this loop,
		// and will need responses before the ChatModel can run again
		if ( ! running && pendingToolCalls.length > 0 ) {
			pendingToolCalls.forEach( ( tool_call ) => {
				if ( tool_call.inProgress ) {
					return;
				}

				if ( tool_call.error ) {
					// console.error( '⚙️ Tool call error', tool_call.error );
					throw new Error( tool_call.error );
				}

				const callback = callbacks[ tool_call.function.name ];

				if ( typeof callback === 'function' ) {
					console.warn( '🧠 Tool callback', tool_call.function.name );
					setToolResult(
						tool_call.id,
						callback( tool_call.function.arguments )
					);
				}
			} );
		}
	}, [ callbacks, pendingToolCalls, running, setToolResult ] );
};

export default useToolExecutor;
