import { deepEqual } from './utils.js';

const getVar = ( obj, path ) => {
	return path.split( '.' ).reduce( ( acc, part ) => acc && acc[ part ], obj );
};

export const includeString =
	( key, { string } ) =>
	async ( run ) => {
		return {
			key,
			score: run.outputs?.output.content.includes( string ),
		};
	};

export const includeContext =
	( key, { contextName } ) =>
	async ( run, example ) => {
		// get the variable from the context using dot notation
		const varValue = getVar( example.inputs.context, contextName );
		if ( ! varValue ) {
			return {
				key,
				score: false,
			};
		}
		return {
			key,
			score: run.outputs?.output.content.includes( varValue ),
		};
	};

export const matchRegex =
	( key, { pattern } ) =>
	async ( run ) => {
		return {
			key,
			score: new RegExp( pattern ).test( run.outputs?.output.content ),
		};
	};

export const matchOutput = ( key ) => async ( run, example ) => {
	return {
		key,
		score: deepEqual( example.outputs, run.outputs ),
	};
};

// matches either output.content or output.tool_calls[0].function.name
export const matchMessageOrToolCall = ( key ) => async ( run, example ) => {
	const exampleContent = example.outputs?.output.content;
	const exampleToolCall =
		example.outputs?.output.tool_calls[ 0 ]?.function?.name;
	const outputContent = run.outputs?.output.content;
	const outputToolCall = run.outputs?.output.tool_calls[ 0 ]?.function?.name;

	console.warn( 'matching message or tool call', {
		exampleContent,
		exampleToolCall,
		outputContent,
		outputToolCall,
	} );
	return {
		key,
		score:
			( exampleContent && exampleContent === outputContent ) ||
			( exampleToolCall && exampleToolCall === outputToolCall ),
	};
};
