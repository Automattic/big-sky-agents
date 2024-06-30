'use strict';

// Adapted from doT.js, 2011-2014, Laura Doktorova, https://github.com/olado/doT
// Licensed under the MIT license.

/**
 * {{ }}	for evaluation
 * {{= }}	for interpolation
 * {{! }}	for interpolation with encoding
 * {{# }}	for compile-time evaluation/includes and partials
 * {{## #}}	for compile-time defines
 * {{? }}	for conditionals
 * For array iteration:
 * {{~ arrayname :varname}}
 *   {{= varname.title}}
 *   {{= varname.description}}
 * {{~}}
 */

const templateSettings = {
	argName: 'it',
	encoders: {},
	selfContained: false,
	strip: true,
	internalPrefix: '_val',
	encodersPrefix: '_enc',
	delimiters: {
		start: '{{',
		end: '}}',
	},
};

// depends on selfContained mode
const encoderType = {
	false: 'function',
	true: 'string',
};

const defaultSyntax = {
	evaluate: /\{\{([\s\S]+?(\}?)+)\}\}/g,
	interpolate: /\{\{=([\s\S]+?)\}\}/g,
	typeInterpolate: /\{\{%([nsb])=([\s\S]+?)\}\}/g,
	encode: /\{\{([a-z_$]+[\w$]*)?!([\s\S]+?)\}\}/g,
	use: /\{\{#([\s\S]+?)\}\}/g,
	useParams:
		/(^|[^\w$])def(?:\.|\[[\'\"])([\w$\.]+)(?:[\'\"]\])?\s*\:\s*([\w$]+(?:\.[\w$]+|\[[^\]]+\])*|\"[^\"]+\"|\'[^\']+\'|\{[^\}]+\}|\[[^\]]*\])/g,
	define: /\{\{##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\}\}/g,
	defineParams: /^\s*([\w$]+):([\s\S]+)/,
	conditional: /\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
	iterate:
		/\{\{~\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\}\})/g,
};

const currentSyntax = { ...defaultSyntax };

const TYPES = {
	n: 'number',
	s: 'string',
	b: 'boolean',
};

function resolveDefs( c, syn, block, def ) {
	return ( typeof block === 'string' ? block : block.toString() )
		.replace( syn.define, ( _1, code, assign, value ) => {
			if ( code.indexOf( 'def.' ) === 0 ) {
				code = code.substring( 4 );
			}
			if ( ! ( code in def ) ) {
				if ( assign === ':' ) {
					value.replace( syn.defineParams, ( _2, param, v ) => {
						def[ code ] = { arg: param, text: v };
					} );
					if ( ! ( code in def ) ) {
						def[ code ] = value;
					}
				} else {
					new Function( 'def', `def['${ code }']=${ value }` )( def );
				}
			}
			return '';
		} )
		.replace( syn.use, ( _1, code ) => {
			code = code.replace( syn.useParams, ( _2, s, d, param ) => {
				if ( def[ d ] && def[ d ].arg && param ) {
					const rw = unescape(
						( d + ':' + param ).replace( /'|\\/g, '_' )
					);
					def.__exp = def.__exp || {};
					def.__exp[ rw ] = def[ d ].text.replace(
						new RegExp(
							`(^|[^\\w$])${ def[ d ].arg }([^\\w$])`,
							'g'
						),
						`$1${ param }$2`
					);
					return s + `def.__exp['${ rw }']`;
				}
			} );
			const v = new Function( 'def', 'return ' + code )( def );
			return v ? resolveDefs( c, syn, v, def ) : v;
		} );
}

function unescape( code ) {
	return code.replace( /\\('|\\)/g, '$1' ).replace( /[\r\t\n]/g, ' ' );
}

export function compile( tmpl, def ) {
	let sid = 0;
	let str = resolveDefs( templateSettings, currentSyntax, tmpl, def || {} );
	const needEncoders = {};

	str = (
		"let out='" +
		( templateSettings.strip
			? str
					.trim()
					.replace( /[\t ]+(\r|\n)/g, '\n' ) // remove trailing spaces
					.replace( /(\r|\n)[\t ]+/g, ' ' ) // leading spaces reduced to " "
					.replace( /\r|\n|\t|\/\*[\s\S]*?\*\//g, '' ) // remove breaks, tabs and JS comments
			: str
		)
			.replace( /'|\\/g, '\\$&' )
			.replace(
				currentSyntax.interpolate,
				( _, code ) => `'+(${ unescape( code ) })+'`
			)
			.replace( currentSyntax.typeInterpolate, ( _, typ, code ) => {
				sid++;
				const val = templateSettings.internalPrefix + sid;
				const error = `throw new Error("expected ${ TYPES[ typ ] }, got "+ (typeof ${ val }))`;
				return `';const ${ val }=(${ unescape(
					code
				) });if(typeof ${ val }!=="${
					TYPES[ typ ]
				}") ${ error };out+=${ val }+'`;
			} )
			.replace( currentSyntax.encode, ( _, enc = '', code ) => {
				needEncoders[ enc ] = true;
				code = unescape( code );
				// eslint-disable-next-line no-nested-ternary
				const e = templateSettings.selfContained
					? enc
					: enc
					? '.' + enc
					: '[""]';
				return `'+${ templateSettings.encodersPrefix }${ e }(${ code })+'`;
			} )
			.replace( currentSyntax.conditional, ( _, elseCase, code ) => {
				if ( code ) {
					code = unescape( code );
					return elseCase
						? `';}else if(${ code }){out+='`
						: `';if(${ code }){out+='`;
				}
				return elseCase ? "';}else{out+='" : "';}out+='";
			} )
			.replace( currentSyntax.iterate, ( _, arr, vName, iName ) => {
				if ( ! arr ) {
					return "';} } out+='";
				}
				sid++;
				const defI = iName ? `let ${ iName }=-1;` : '';
				const incI = iName ? `${ iName }++;` : '';
				const val = templateSettings.internalPrefix + sid;
				return `';const ${ val }=${ unescape(
					arr
				) };if(${ val }){${ defI }for (const ${ vName } of ${ val }){${ incI }out+='`;
			} )
			.replace(
				currentSyntax.evaluate,
				( _, code ) => `';${ unescape( code ) }out+='`
			) +
		"';return out;"
	)
		.replace( /\n/g, '\\n' )
		.replace( /\t/g, '\\t' )
		.replace( /\r/g, '\\r' )
		.replace( /(\s|;|\}|^|\{)out\+='';/g, '$1' )
		.replace( /\+''/g, '' );

	const args = Array.isArray( templateSettings.argName )
		? properties( templateSettings.argName )
		: templateSettings.argName;

	if ( Object.keys( needEncoders ).length === 0 ) {
		return try_( () => new Function( args, str ) );
	}
	checkEncoders( templateSettings, needEncoders );
	str = `return function(${ args }){${ str }};`;
	return try_( () =>
		templateSettings.selfContained
			? new Function(
					( str =
						addEncoders( templateSettings, needEncoders ) + str )
			  )()
			: new Function( templateSettings.encodersPrefix, str )(
					templateSettings.encoders
			  )
	);

	function try_( f ) {
		try {
			return f();
		} catch ( e ) {
			console.log( 'Could not create a template function: ' + str );
			throw e;
		}
	}
}

function properties( args ) {
	return args.reduce( ( s, a, i ) => s + ( i ? ',' : '' ) + a, '{' ) + '}';
}

function checkEncoders( c, encoders ) {
	const typ = encoderType[ c.selfContained ];
	for ( const enc in encoders ) {
		const e = c.encoders[ enc ];
		if ( ! e ) {
			throw new Error( `unknown encoder "${ enc }"` );
		}
		if ( typeof e !== typ ) {
			throw new Error(
				`selfContained ${ c.selfContained }: encoder type must be "${ typ }"`
			);
		}
	}
}

function addEncoders( c, encoders ) {
	let s = '';
	for ( const enc in encoders ) {
		s += `const ${ c.encodersPrefix }${ enc }=${ c.encoders[ enc ] };`;
	}
	return s;
}
