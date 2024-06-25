/* eslint-disable camelcase, no-console */
import { useEffect } from 'react';

const useToolExecutor = ( {
	chat: { error, running, pendingToolCalls, setToolResult },
	toolkit: { callbacks },
} ) => {
	useEffect( () => {
		// process tool calls for any tools with callbacks
		// note that tools without callbacks will be processed outside this loop,
		// and will need responses before the ChatModel can run again
		if ( ! error && ! running && pendingToolCalls.length > 0 ) {
			pendingToolCalls.forEach( ( tool_call ) => {
				if ( tool_call.inProgress ) {
					return;
				}

				if ( tool_call.error ) {
					// console.error( '⚙️ Tool call error', tool_call.error );
					throw new Error( tool_call.error );
				}

				// parse arguments if they're a string
				const args =
					typeof tool_call.function.arguments === 'string'
						? JSON.parse( tool_call.function.arguments )
						: tool_call.function.arguments;

				// see: https://community.openai.com/t/model-tries-to-call-unknown-function-multi-tool-use-parallel/490653/7
				if ( tool_call.function.name === 'multi_tool_use.parallel' ) {
					/**
					 * Looks like this:
					 * multi_tool_use.parallel({"tool_uses":[{"recipient_name":"WPSiteSpec","parameters":{"title":"Lorem Ipsum","description":"Lorem ipsum dolor sit amet, consectetur adipiscing elit.","type":"Blog","topic":"Lorem Ipsum","location":"Lorem Ipsum"}}]})
					 *
					 * I assume the result is supposed to be an array...
					 */
					// create an array of promises for the tool uses
					const promises = args.tool_uses.map( ( tool_use ) => {
						const callback = callbacks[ tool_use.recipient_name ];

						if ( typeof callback === 'function' ) {
							console.warn(
								'🧠 Parallel tool callback',
								tool_use.recipient_name
							);
							return callback( tool_use.parameters );
						}
						return `Unknown tool ${ tool_use.recipient_name }`;
					} );

					// set to tool result to the promise
					setToolResult( tool_call.id, Promise.all( promises ) );
				}

				const callback = callbacks[ tool_call.function.name ];

				if ( typeof callback === 'function' ) {
					console.warn( '🧠 Tool callback', tool_call.function.name );
					setToolResult( tool_call.id, callback( args ) );
				}
			} );
		}
	}, [ error, callbacks, pendingToolCalls, running, setToolResult ] );
};

export default useToolExecutor;
