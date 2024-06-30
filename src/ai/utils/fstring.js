/**
 * Extracted from https://github.com/langchain-ai/langchainjs/blob/main/langchain-core/src/prompts/
 * Under the MIT license.
 * Which in turn was extracted from Python's f-string implementation.
 * See: https://github.com/python/cpython/blob/135ec7cefbaffd516b77362ad2b2ad1025af462e/Objects/stringlib/unicode_format.h#L700-L706
 *
 * @param {string} template
 * @return {Array<{type: 'literal', text: string} | {type: 'variable', name: string}>} nodes
 */
const parse = ( template ) => {
	const chars = template.split( '' );
	const nodes = [];

	// bracket: "}" | "{" | "{}"
	const nextBracket = ( bracket, start ) => {
		for ( let i = start; i < chars.length; i += 1 ) {
			if ( bracket.includes( chars[ i ] ) ) {
				return i;
			}
		}
		return -1;
	};

	let i = 0;
	while ( i < chars.length ) {
		if (
			chars[ i ] === '{' &&
			i + 1 < chars.length &&
			chars[ i + 1 ] === '{'
		) {
			nodes.push( { type: 'literal', text: '{' } );
			i += 2;
		} else if (
			chars[ i ] === '}' &&
			i + 1 < chars.length &&
			chars[ i + 1 ] === '}'
		) {
			nodes.push( { type: 'literal', text: '}' } );
			i += 2;
		} else if ( chars[ i ] === '{' ) {
			const j = nextBracket( '}', i );
			if ( j < 0 ) {
				throw new Error( "Unclosed '{' in template." );
			}

			nodes.push( {
				type: 'variable',
				name: chars.slice( i + 1, j ).join( '' ),
			} );
			i = j + 1;
		} else if ( chars[ i ] === '}' ) {
			throw new Error( "Single '}' in template." );
		} else {
			const next = nextBracket( '{}', i );
			const text = (
				next < 0 ? chars.slice( i ) : chars.slice( i, next )
			).join( '' );
			nodes.push( { type: 'literal', text } );
			i = next < 0 ? chars.length : next;
		}
	}
	return nodes;
};

export const compile = ( template ) => {
	const names = new Set();
	// returns a function which, when given values, renders the template
	// the function also has a property `variables` which is an array of the variable names
	const parsed = parse( template );
	parsed.forEach( ( node ) => {
		if ( node.type === 'variable' ) {
			names.add( node.name );
		}
	} );
	const compiled = ( values ) => interpolate( parsed, values );
	compiled.variables = Array.from( names );
	return compiled;
};

const interpolate = ( parsed, values ) => {
	const variableNames = parsed
		.filter( ( node ) => node.type === 'variable' )
		.map( ( node ) => node.name );
	return parsed.reduce( ( res, node ) => {
		if ( node.type === 'variable' ) {
			if ( node.name in values ) {
				return (
					res +
					( typeof values[ node.name ] === 'function'
						? values[ node.name ]()
						: values[ node.name ] )
				);
			}
			throw new Error(
				`Missing value for input ${
					node.name
				}. Variables: ${ variableNames.join(
					', '
				) }, Values: ${ JSON.stringify( values ) }`
			);
		}

		return res + node.text;
	}, '' );
};
