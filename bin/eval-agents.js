// eslint-disable-next-line import/no-unresolved
import { loadDataset, runEvaluation } from '@automattic/big-sky-agents/eval';
import { ChatModelService, ChatModelType } from '../src';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Method to find a service by name
const findServiceByName = ( name ) => {
	for ( const key in ChatModelService ) {
		if ( ChatModelService[ key ] === name ) {
			return ChatModelService[ key ];
		}
	}
	return null;
};

const findModelByName = ( name ) => {
	for ( const key in ChatModelType ) {
		if ( ChatModelType[ key ] === name ) {
			return ChatModelType[ key ];
		}
	}
	return null;
};

const argv = yargs( hideBin( process.argv ) )
	.option( 'name', {
		alias: 'n',
		type: 'string',
		description: 'Name of the evaluation',
		default: 'Evaluation',
	} )
	.option( 'dataset', {
		alias: 'd',
		type: 'string',
		description: 'Path to the dataset file',
		demandOption: true,
	} )
	.option( 'apiKey', {
		alias: 'k',
		type: 'string',
		description: 'API key for the service',
		default: process.env.OPENAI_API_KEY,
	} )
	.option( 'temperature', {
		alias: 't',
		type: 'number',
		description: 'Temperature for the model',
		default: 0.1,
	} )
	.option( 'maxTokens', {
		alias: 'm',
		type: 'number',
		description: 'Maximum tokens for the model',
		default: 2000,
	} )
	.option( 'model', {
		alias: 'o',
		type: 'string',
		description: 'Model type to use',
		choices: ChatModelType.getAvailable(),
		default: ChatModelType.GPT_4O,
	} )
	.option( 'service', {
		alias: 's',
		type: 'string',
		description: 'Service to use',
		choices: ChatModelService.getAvailable(),
		default: ChatModelService.OPENAI,
	} )
	.option( 'agent', {
		alias: 'a',
		type: 'array',
		description: 'Paths to agent JavaScript files',
		demandOption: true,
	} )
	.help()
	.alias( 'help', 'h' ).argv;

// Load agents from provided file paths
const loadAgent = async ( agentPath ) => {
	const agent = await import( path.resolve( agentPath ) );
	return agent.default;
};

const loadedAgents = await Promise.all( argv.agent.map( loadAgent ) );

const dataset = await loadDataset( argv.dataset );
const evaluationName = argv.name;
const apiKey = argv.apiKey;
const temperature = argv.temperature;
const maxTokens = argv.maxTokens;
const model = findModelByName( argv.model );
const service = findServiceByName( argv.service );

const result = await runEvaluation(
	evaluationName,
	loadedAgents,
	dataset,
	model,
	service,
	apiKey,
	temperature,
	maxTokens
);

console.log( 'result', JSON.stringify( result, null, 2 ) );
