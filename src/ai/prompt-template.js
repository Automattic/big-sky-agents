import { compile as compileDotTemplate } from './utils/dot.js';
import { compile as compileFString } from './utils/fstring.js';

export class Formatter {
	format( /* values */ ) {
		throw new Error( 'Not implemented' );
	}
}

export class StringPromptTemplate extends Formatter {
	constructor( {
		inputVariables,
		template, // string version of the template, for easy comparison
		engine,
		formatters = {},
		...options
	} ) {
		super();
		this.validate( engine, inputVariables );
		this.inputVariables = inputVariables;
		this.engine = engine;
		this.template = template;
		this.formatters = formatters;
		Object.assign( this, options );
	}

	validate( engine, inputVariables ) {
		try {
			const dummyInputs = inputVariables.reduce( ( acc, v ) => {
				acc[ v ] = 'foo';
				return acc;
			}, {} );
			engine( dummyInputs );
		} catch ( e ) {
			throw new Error(
				`Invalid inputs: ${ e.message }, inputs: ${ inputVariables.join(
					', '
				) }`
			);
		}
	}

	format( values ) {
		// apply formatters
		const formattedValues = this.inputVariables.reduce( ( acc, v ) => {
			if ( v in this.formatters ) {
				acc[ v ] = this.formatters[ v ].format( values );
			} else {
				acc[ v ] = values[ v ];
			}
			return acc;
		}, {} );
		return this.engine( formattedValues );
	}
}

/**
 * A PromptTemplate is a template string that can be formatted with values.
 *
 * Values can be static or a function that returns a value.
 *
 * Formatters can be anything that implements the format and equals methods.
 */
export class FStringPromptTemplate extends StringPromptTemplate {
	constructor( { template, ...options } ) {
		const engine = compileFString( template );
		super( {
			inputVariables: engine.variables,
			engine,
			template,
			...options,
		} );
		this.engine = engine;
	}

	static fromString( template, options ) {
		return new FStringPromptTemplate( { template, ...options } );
	}
}

export class DotPromptTemplate extends StringPromptTemplate {
	constructor( { template, inputVariables, ...options } ) {
		const engine = compileDotTemplate( template );
		super( { engine, template, inputVariables, ...options } );
	}

	static fromString( template, inputVariables = [], options = {} ) {
		return new DotPromptTemplate( {
			template,
			inputVariables,
			...options,
		} );
	}
}
