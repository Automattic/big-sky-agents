import { deepEqual } from './utils.js';

export const IGNORE = 'IGNORE';

const getVar = ( obj, path ) => {
	return path.split( '.' ).reduce( ( acc, part ) => acc && acc[ part ], obj );
};

export const includeString =
	( key, { string } ) =>
	async ( run ) => {
		console.warn( 'includeString', string, run.outputs );
		return {
			key,
			score: run.outputs?.message.content.includes( string ),
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
			score: run.outputs?.message.content.includes( varValue ),
		};
	};

export const matchRegex =
	( key, { pattern } ) =>
	async ( run ) => {
		return {
			key,
			score: new RegExp( pattern ).test( run.outputs?.message.content ),
		};
	};

export const matchOutput = ( key ) => async ( run, example ) => {
	return {
		key,
		score: deepEqual( example.outputs, run.outputs ),
	};
};

const removeIgnoredKeys = ( obj1, obj2 ) => {
	if (
		typeof obj1 !== 'object' ||
		obj1 === null ||
		typeof obj2 !== 'object' ||
		obj2 === null
	) {
		return;
	}

	if ( Array.isArray( obj1 ) && Array.isArray( obj2 ) ) {
		for ( let i = 0; i < obj1.length; i++ ) {
			removeIgnoredKeys( obj1[ i ], obj2[ i ] );
		}
	} else {
		for ( const key in obj1 ) {
			if ( obj1[ key ] === 'IGNORE' ) {
				delete obj1[ key ];
				delete obj2[ key ];
			} else if (
				typeof obj1[ key ] === 'object' &&
				obj1[ key ] !== null
			) {
				removeIgnoredKeys( obj1[ key ], obj2[ key ] );
			}
		}
	}
};

export const matchToolCall = ( key ) => async ( run, example ) => {
	const outputMessage = run.outputs?.message;
	const exampleMessage = example.outputs.message;

	const exampleToolCall =
		exampleMessage?.tool_calls?.[ 0 ]?.function.name ?? '';
	const outputToolCall =
		outputMessage?.tool_calls?.[ 0 ]?.function.name ?? '';
	const nameMatch = ! exampleToolCall || exampleToolCall === outputToolCall;

	const exampleToolCallArgs =
		exampleMessage.tool_calls?.[ 0 ]?.function.arguments ?? {};
	const outputToolCallArgs = JSON.parse(
		outputMessage.tool_calls?.[ 0 ]?.function.arguments || '{}'
	);
	// recursively filter out all keys with a value of 'IGNORE'
	removeIgnoredKeys( exampleToolCallArgs, outputToolCallArgs );

	const argsMatch = deepEqual( exampleToolCallArgs, outputToolCallArgs );

	return {
		key,
		score: nameMatch && argsMatch,
	};
};

// matches either output.content or output.tool_calls[0].function.name
export const matchMessageOrToolCall = ( key ) => async ( run, example ) => {
	const outputMessage = run.outputs?.message;
	const exampleMessage = example.outputs.message;

	const exampleContent = exampleMessage.content ?? '';
	const exampleToolCall =
		exampleMessage.tool_calls?.[ 0 ]?.function.name ?? '';

	const outputContent = outputMessage.content ?? '';
	const outputToolCall = outputMessage.tool_calls?.[ 0 ]?.function.name ?? '';

	return {
		key,
		score:
			( ! exampleContent || exampleContent === outputContent ) &&
			( ! exampleToolCall || exampleToolCall === outputToolCall ),
	};
};

// rough match of message content using gpt-4o-mini
export const compareContent = ( key ) => async ( run, example ) => {
	const outputMessage = run.outputs?.message.content ?? '';
	const exampleMessage = example.outputs.message?.content ?? '';

	if ( ! exampleMessage && ! outputMessage ) {
		// nothing to match, so return true
		return {
			key,
			score: true,
		};
	}

	if ( ! exampleMessage || ! outputMessage ) {
		// one is empty, so return false
		return {
			key,
			score: false,
		};
	}

	const toolName = 'SimilarityResult';

	const systemMessage = `You are a helpful assistant and an expert in comparing and classifying sentences`;

	const userMessage =
		`I am going to give you two sentences to compare. You need to tell me if they are similar. Call the ${ toolName } tool with your result.` +
		`\n\nFor example, these two sentences are similar:\nSentence 1: "Please give me your location"\nSentence 2: "In order to proceed, can you tell me where you are?".\nSimilarityResult: similar` +
		`\n\nThese two sentences are different: \nSentence 1: "Let's create a post"\nSentence 2: "Let's create a comment".\nSimilarityResult: different` +
		`\n\nNow, here are your sentences:` +
		`\n\nSentence 1: "${ exampleMessage }"\nSentence 2: "${ outputMessage }"`;

	const tool = {
		type: 'function',
		function: {
			name: toolName,
			description: 'Called with the result of comparing two sentences',
			parameters: {
				type: 'object',
				properties: {
					value: {
						type: 'string',
						description:
							'"similar" if the sentences are similar, "different" if they are different',
						enum: [ 'similar', 'different' ],
					},
				},
			},
		},
	};

	const messages = [
		{
			role: 'system',
			content: systemMessage,
		},
		{
			role: 'user',
			content: userMessage,
		},
	];

	const result = await fetch( 'https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${ process.env.OPENAI_API_KEY }`,
		},
		body: JSON.stringify( {
			model: 'gpt-4o-mini',
			messages,
			tools: [ tool ],
			max_tokens: 2000,
			temperature: 0.1,
		} ),
	} );

	const resultJson = await result.json();

	if ( resultJson.choices?.[ 0 ]?.finish_reason !== 'tool_calls' ) {
		throw new Error(
			`Expected tool_call, got ${ resultJson.choices?.[ 0 ]?.finish_reason }`
		);
	}

	const message = resultJson.choices?.[ 0 ]?.message;
	const toolCall = message.tool_calls?.[ 0 ];

	if ( ! toolCall ) {
		throw new Error( `Missing tool call, expected ${ toolName }` );
	}

	if ( toolCall.function.name !== toolName ) {
		throw new Error(
			`Expected ${ toolName }, got ${ toolCall.function.name }`
		);
	}

	const parsedArgs = JSON.parse( toolCall.function.arguments );

	return {
		key,
		score: parsedArgs.value === 'similar',
	};
};
