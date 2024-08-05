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

const WeatherAgent = {
	id: 'weatherbot',
	name: 'Weather Bot',
	instructions: 'You are a helpful weather bot',
	additionalInstructions: ( context ) => {
		return `The user's current location is ${ context.currentLocation }.`;
	},
	toolkits: [
		{
			name: 'weather',
			context: {
				currentLocation: 'Melbourne, Australia',
			},
			tools: [
				{
					name: 'getWeather',
					description: 'Get the weather for a location',
					parameters: {
						type: 'object',
						properties: {
							location: {
								type: 'string',
							},
						},
						required: [ 'location' ],
					},
				},
			],
			callbacks: {
				getWeather: async ( { location } ) => {
					const response = await fetch(
						`https://wttr.in/${ location }?format=%C+%t`
					);
					const text = await response.text();
					return text;
				},
			},
		},
	],
	onStart: ( invoke ) => {
		console.warn( 'Weather Agent started' );
		invoke.agentSay( 'What location would you like the weather for?' );
	},
};

const result = await runEvaluation(
	'Big Sky',
	[ WeatherAgent ],
	dataset,
	model,
	service,
	apiKey,
	temperature,
	maxTokens
);

console.log( 'result', JSON.stringify( result, null, 2 ) );
