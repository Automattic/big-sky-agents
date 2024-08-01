const getVar = ( obj, path ) => {
	return path.split( '.' ).reduce( ( acc, part ) => acc && acc[ part ], obj );
};

export const includeString =
	( key, { string } ) =>
	async ( run, example ) => {
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
