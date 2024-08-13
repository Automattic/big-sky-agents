import { ChatModelService, ChatModelType } from '../src/ai/chat-model.js';
import { loadDataset, runEvaluation } from '../src/eval.js';
import WeatherAgentV1 from '../src/ai/agents/weather-agent/v1.js';
import WeatherAgentV2 from '../src/ai/agents/weather-agent/v2.js';
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

const result = await runEvaluation(
	'Big Sky',
	[ WeatherAgentV1, WeatherAgentV2 ],
	dataset,
	model,
	service,
	apiKey,
	temperature,
	maxTokens
);

console.log( 'result', JSON.stringify( result, null, 2 ) );
