// Utility functions for namespacing
export const createNamespacedSelectors = ( namespace, selectors ) => {
	const namespacedSelectors = {};
	for ( const key in selectors ) {
		if ( Object.prototype.hasOwnProperty.call( selectors, key ) ) {
			namespacedSelectors[ key ] = ( state, ...args ) =>
				selectors[ key ]( state[ namespace ], ...args );
		}
	}
	return namespacedSelectors;
};

// this function creates namespaced actions by ensuring that thunks are called with the correct namespace
export const createNamespacedActions = ( namespace, actions ) => {
	const namespacedActions = {};
	for ( const key in actions ) {
		if ( Object.prototype.hasOwnProperty.call( actions, key ) ) {
			namespacedActions[ key ] = ( ...args ) => {
				const action = actions[ key ]( ...args );
				if ( typeof action === 'function' ) {
					return ( { select, ...thunkArgs } ) => {
						return action( {
							select: ( callback ) => {
								return select( ( state ) => {
									return callback( state.root[ namespace ] );
								} );
							},
							...thunkArgs,
						} );
					};
				}
				return action;
			};
		}
	}
	return namespacedActions;
};
