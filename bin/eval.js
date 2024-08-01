import { ChatModelService, ChatModelType } from '../src/ai/chat-model.js';
import { runEvaluation } from '../src/eval.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// load .env
dotenv.config();

// Ensure a dataset file is provided
if ( process.argv.length < 3 ) {
	console.error(
		'Please provide the path to the dataset file as the first command line parameter.'
	);
	process.exit( 1 );
}

const datasetFilePath = process.argv[ 2 ];

// Read and parse the dataset file
let dataset;
try {
	const datasetContent = fs.readFileSync(
		path.resolve( datasetFilePath ),
		'utf-8'
	);
	dataset = JSON.parse( datasetContent );
} catch ( error ) {
	console.error(
		'Error reading or parsing the dataset file:',
		error.message
	);
	process.exit( 1 );
}

const apiKey = process.env.OPENAI_API_KEY;
const temperature = 0.9;
const maxTokens = 2000;
const model = ChatModelType.GPT_4O_MINI;
const service = ChatModelService.OPENAI;

const anonAgent = {
	name: 'Anonymous',
	instructions: 'You are a WordPress assistant.',
};

const wapuuAgent = {
	name: 'Wapuu',
	version: 2,
	instructions: ( context ) =>
		`You are Wapuu, a WordPress assistant. The site title is "${ context.site?.siteTitle }".`,
};

// evaluator
// const hasWapuuName = async ( run, example ) => {
// 	return {
// 		key: 'has_wapuu_name',
// 		score: /Wapuu/.test( run.outputs?.output.content ),
// 	};
// };

const result = await runEvaluation(
	'Big Sky',
	[ anonAgent, wapuuAgent ],
	dataset,
	model,
	service,
	apiKey,
	temperature,
	maxTokens
);

console.log( 'result', JSON.stringify( result, null, 2 ) );
