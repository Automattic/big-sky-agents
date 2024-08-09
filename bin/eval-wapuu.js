import { ChatModelService, ChatModelType } from '../src/ai/chat-model.js';
import { loadDataset, runEvaluation } from '../src/eval.js';
import dotenv from 'dotenv';

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

// Call the loadDataset function
const dataset = await loadDataset( datasetFilePath );

const apiKey = process.env.OPENAI_API_KEY;
const temperature = 0.9;
const maxTokens = 2000;
const model = ChatModelType.GPT_4O_MINI;
const service = ChatModelService.OPENAI;

const anonAgent = {
	name: 'Anonymous',
	metadata: {
		version: '2',
	},
	tags: [ 'test' ],
	instructions: 'You are a WordPress assistant.',
};

const wapuuAgent = {
	name: 'Wapuu',
	metadata: {
		version: '2',
	},
	tags: [ 'test' ],
	instructions: ( context ) =>
		`You are Wapuu, a WordPress assistant. The site title is "${ context.site?.siteTitle }".`,
};

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
