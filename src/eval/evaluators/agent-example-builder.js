import deepmerge from 'deepmerge';

function AgentExampleBuilder() {
	function builder( id ) {
		let context = {};
		let description = '';
		const messages = [];
		let expectContent = '';
		const expectToolCalls = [];
		return {
			description( desc ) {
				description = desc;
				return this;
			},

			context( ...contexts ) {
				contexts.forEach( ( ctx ) => {
					if ( ctx.toJSON ) {
						context = deepmerge( context, ctx.toJSON() );
					} else {
						context = deepmerge( context, ctx );
					}
				} );
				return this;
			},

			user( message ) {
				messages.push( {
					role: 'user',
					content: message,
				} );
				return this;
			},

			assistant( message ) {
				messages.push( {
					role: 'assistant',
					content: message,
				} );
				return this;
			},

			expect( content ) {
				expectContent = content;
				return this;
			},

			expectToolCall( functionName, args ) {
				expectToolCalls.push( {
					type: 'function',
					function: {
						name: functionName,
						arguments: args,
					},
				} );
				return this;
			},

			toJSON() {
				return {
					id,
					description,
					inputs: {
						context,
						messages,
					},
					outputs: {
						message: {
							role: 'assistant',
							content: expectContent,
							tool_calls: expectToolCalls,
						},
					},
				};
			},
		};
	}

	return builder;
}

export default AgentExampleBuilder;
