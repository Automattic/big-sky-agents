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
// TODO: this doesn't work yet
export const createNamespacedActions = ( namespace, actions ) => {
	const namespacedActions = {};
	for ( const key in actions ) {
		if ( Object.prototype.hasOwnProperty.call( actions, key ) ) {
			namespacedActions[ key ] = ( ...args ) => {
				console.warn( 'invoking action', key, args );
				const action = actions[ key ]( ...args );
				console.warn( 'action', action );
				// if it's a function that accepts dispatch/select, wrap it in a function that applies the namespace to the selectors
				if ( typeof action === 'function' ) {
					console.warn( 'mapping thunk arguments for', key );
					return ( { select, ...thunkArgs } ) => {
						// const namespacedDispatch = ( ...dispatchArgs ) =>
						// 	dispatch( { ...dispatchArgs, namespace } );
						return action( {
							select: ( callback ) => {
								console.warn( 'select', { namespace } );
								return select( ( state ) => {
									console.warn( 'select callback', {
										state,
										namespace,
									} );
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
