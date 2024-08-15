import { deepEqual } from './utils.js';

const getVar = ( obj, path ) => {
	return path.split( '.' ).reduce( ( acc, part ) => acc && acc[ part ], obj );
};

export const includeString =
	( key, { string } ) =>
	async ( run ) => {
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

// see: https://openai.com/index/introducing-structured-outputs-in-the-api/
const getJSONChatCompletion = async (
	messages,
	json_schema,
	max_tokens = 2000,
	temperature = 0.1
) => {
	const model = 'gpt-4o-2024-08-06';
	const result = await fetch( 'https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${ process.env.OPENAI_API_KEY }`,
		},
		body: JSON.stringify( {
			model,
			messages,
			max_tokens,
			temperature,
			response_format: {
				type: 'json_schema',
				json_schema,
			},
		} ),
	} );

	const resultJson = await result.json();

	if ( resultJson.error ) {
		throw new Error( resultJson.error.message );
	}

	return JSON.parse( resultJson.choices?.[ 0 ]?.message.content );
};

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

	const output_schema = {
		name: toolName,
		strict: true,
		description: 'Called with the result of comparing two sentences',
		schema: {
			type: 'object',
			properties: {
				value: {
					type: 'string',
					description:
						'"similar" if the sentences are similar, "different" if they are different',
					enum: [ 'similar', 'different' ],
				},
			},
			required: [ 'value' ],
			additionalProperties: false,
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

	const resultJson = await getJSONChatCompletion( messages, output_schema );

	return {
		key,
		score: resultJson.value === 'similar',
	};
};

// convert content and any tool_calls to markdown
const messageToMarkdown = ( message ) => {
	if ( ! message ) {
		return null;
	}

	const content = message.content ?? '';
	const toolCalls = message.tool_calls
		?.map( ( toolCall ) => {
			const args =
				typeof toolCall.function.arguments === 'string'
					? toolCall.function.arguments
					: JSON.stringify( toolCall.function.arguments );
			return `Called Tool: ${ toolCall.function.name }(${ args })`;
		} )
		.join( '\n\n' );

	return [ content, toolCalls ?? '' ].join( '\n\n' );
};

// evaluate the first 2 of N comparative experiments using a basic LLM preference evaluator
export const evaluatePairwise = ( key ) => async ( runs, example ) => {
	const scores = {};
	const [ runA, runB ] = runs;

	if ( ! runA || ! runB ) {
		throw new Error( 'Expected at least two runs' );
	}

	const messagesMarkdownSummary = example.inputs?.messages
		.map( ( message ) => `**${ message.role }**: ${ message.content }` )
		.join( '\n\n' );

	const payload = {
		messages: messagesMarkdownSummary,
		answer_a: messageToMarkdown( runA?.outputs?.message ) ?? 'N/A',
		answer_b: messageToMarkdown( runB?.outputs?.message ) ?? 'N/A',
	};

	const messages = [
		{
			role: 'system',
			content: [
				'Please act as an impartial judge and evaluate the quality of the responses provided by two AI assistants to the chat displayed below.',
				"You should choose the assistant that follows the user's instructions and responds to the user's needs better.",
				'Your evaluation should consider factors such as the helpfulness, relevance, accuracy, depth, creativity, and level of detail of their responses.',
				'Begin your evaluation by comparing the two responses and provide a short explanation.',
				'Avoid any position biases and ensure that the order in which the responses were presented does not influence your decision.',
				'Do not allow the length of the responses to influence your evaluation. Do not favor certain names of the assistants. Be as objective as possible.',
			].join( ' ' ),
		},
		{
			role: 'user',
			content: [
				`[Chat Messages]\n${ payload.messages }`,
				`[The Start of Assistant A's Answer] ${ payload.answer_a } [The End of Assistant A's Answer]`,
				`[The Start of Assistant B's Answer] ${ payload.answer_b } [The End of Assistant B's Answer]`,
			].join( '\n\n' ),
		},
	];

	const output_schema = {
		name: 'Score',
		strict: true,
		description: [
			`After providing your explanation, output your final verdict by strictly following this format:`,
			`Output "1" if Assistant A answer is better based upon the factors above.`,
			`Output "2" if Assistant B answer is better based upon the factors above.`,
			`Output "0" if it is a tie.`,
		].join( ' ' ),
		schema: {
			type: 'object',
			properties: {
				Preference: {
					type: 'integer',
					description: 'Which assistant answer is preferred?',
				},
			},
			required: [ 'Preference' ],
			additionalProperties: false,
		},
	};

	const resultJson = await getJSONChatCompletion( messages, output_schema );

	switch ( resultJson.Preference ) {
		case 1:
			scores[ runA.id ] = 1;
			scores[ runB.id ] = 0;
			break;
		case 2:
			scores[ runA.id ] = 0;
			scores[ runB.id ] = 1;
			break;
		default:
			scores[ runA.id ] = 0;
			scores[ runB.id ] = 0;
			break;
	}

	return { key, scores };
};

export const customSummaryEvaluator =
	( key ) => async ( /* runs, examples */ ) => {
		// const runIds = runs.map( ( { id } ) => id ).join( ', ' );
		// const exampleIds = examples?.map( ( { id } ) => id ).join( ', ' );
		return Promise.resolve( {
			key,
			score: 1,
			comment: `Example summary evaluator output`,
		} );
	};
