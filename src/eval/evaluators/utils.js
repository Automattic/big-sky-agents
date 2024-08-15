export const deepEqual = ( obj1, obj2 ) => {
	if ( obj1 === obj2 ) {
		return true;
	}
	if (
		typeof obj1 !== 'object' ||
		typeof obj2 !== 'object' ||
		obj1 === null ||
		obj2 === null
	) {
		return false;
	}
	if ( Array.isArray( obj1 ) && Array.isArray( obj2 ) ) {
		if ( obj1.length !== obj2.length ) {
			return false;
		}
		// Sort both arrays and compare them
		const sortedObj1 = [ ...obj1 ].sort();
		const sortedObj2 = [ ...obj2 ].sort();
		return sortedObj1.every( ( item, index ) =>
			deepEqual( item, sortedObj2[ index ] )
		);
	}
	const keys1 = Object.keys( obj1 );
	const keys2 = Object.keys( obj2 );
	if ( keys1.length !== keys2.length ) {
		return false;
	}
	for ( const key of keys1 ) {
		if (
			! keys2.includes( key ) ||
			! deepEqual( obj1[ key ], obj2[ key ] )
		) {
			return false;
		}
	}
	return true;
};
