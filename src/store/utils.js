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
