import { Client } from 'langsmith';
import { evaluate } from 'langsmith/evaluation';
import ChatModel from '../ai/chat-model.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { deepEqual } from './evaluators/utils.js';
import { toOpenAITool } from '../ai/utils/openai.js';
dotenv.config();

const client = new Client();

export const createProject = async ( projectName, description ) => {
	if ( ! ( await client.hasProject( { projectName } ) ) ) {
		await client.createProject( {
			projectName,
			description,
		} );
	}
};

export const loadDataset = ( datasetFilePath ) => {
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
	return dataset;
};

export const createChatDataset = async ( dataset ) => {
	const { name, description, data, metadata = {} } = dataset;
	console.warn( 'create dataset', dataset );
	if ( ! ( await client.hasDataset( { datasetName: name } ) ) ) {
		const datasetResult = await client.createDataset( name, {
			data_type: 'chat',
			description,
		} );

		for ( const example of data ) {
			await client.createExample(
				{ input: example.input },
				{ output: example.output },
				{
					datasetId: datasetResult.id,
					metadata: {
						...metadata,
						exampleId: example.id,
					},
				}
			);
		}
	} else {
		const datasetResult = await client.readDataset( { datasetName: name } );

		// Collect existing example IDs
		const existingExampleIds = new Set();
		for await ( const remoteExample of client.listExamples( {
			datasetId: datasetResult.id,
		} ) ) {
			console.warn( 'remoteExample', remoteExample );
			existingExampleIds.add( remoteExample.metadata.exampleId );

			// Look up from example using id
			const example = data.find(
				( e ) => e.id === remoteExample.metadata.exampleId
			);

			if ( example ) {
				if (
					! deepEqual( example.inputs, remoteExample.inputs ) ||
					! deepEqual( example.outputs, remoteExample.outputs )
				) {
					console.warn( `updating example ${ remoteExample.id }` );
					await client.updateExample( remoteExample.id, {
						inputs: example.inputs,
						outputs: example.outputs,
					} );
				} else {
					console.warn(
						`example ${ remoteExample.id } is up to date`
					);
				}
			} else {
				console.warn( `deleting example ${ remoteExample.id }` );
				await client.deleteExample( remoteExample.id );
			}
		}

		// Add new examples that do not exist in the dataset
		for ( const example of data ) {
			if ( ! existingExampleIds.has( example.id ) ) {
				console.warn( `creating new example ${ example.id }` );
				await client.createExample( example.inputs, example.outputs, {
					datasetId: datasetResult.id,
					metadata: {
						...metadata,
						exampleId: example.id,
					},
				} );
			}
		}
	}
};

// Function to parse and load evaluators
async function loadEvaluators( evaluators ) {
	const parsedEvaluators = [];

	for ( const evaluator of evaluators ) {
		const [ library, func ] = evaluator.function.split( ':' );
		const modulePath = `./evaluators/${ library }.js`;

		console.warn( 'loading evaluator', modulePath, func );

		try {
			// Dynamically import the function from the module
			const { [ func ]: loadedFunction } = await import( modulePath );

			// Call the function with arguments and save the instance
			const evaluatorInstance = loadedFunction(
				evaluator.key,
				evaluator.arguments
			);
			parsedEvaluators.push( evaluatorInstance );
		} catch ( error ) {
			console.error(
				`Failed to load evaluator ${ evaluator.function }:`,
				error
			);
		}
	}

	return parsedEvaluators;
}

export const evaluateAgent = async (
	experimentPrefix,
	agent,
	dataset,
	service,
	apiKey,
	model,
	temperature,
	maxTokens
) => {
	const chatModel = ChatModel.getInstance( service, apiKey );
	const evaluators = await loadEvaluators( dataset.evaluators );
	return await evaluate(
		async ( example ) => {
			console.warn( 'processing', example );
			const { input: messages, context = {} } = example;

			const instructions =
				typeof agent.instructions === 'function'
					? agent.instructions( context )
					: agent.instructions;

			const additionalInstructions =
				typeof agent.additionalInstructions === 'function'
					? agent.additionalInstructions( context )
					: agent.additionalInstructions;

			const tools = [];
			if ( agent.toolkits ) {
				for ( const toolkit of agent.toolkits ) {
					const toolkitTools =
						typeof toolkit.tools === 'function'
							? toolkit.tools( context )
							: toolkit.tools;
					tools.push( ...toolkitTools );
				}
			}

			if ( agent.tools ) {
				const agentTools =
					typeof agent.tools === 'function'
						? agent.tools( context )
						: agent.tools;
				tools.push( ...agentTools );
			}

			console.warn( 'got tools', tools );

			const openAITools = tools.map( toOpenAITool );

			console.warn( 'openAITools', openAITools );

			const chatCompletion = await chatModel.run( {
				instructions,
				additionalInstructions,
				tools: openAITools,
				model,
				messages,
				temperature,
				maxTokens,
			} );
			return {
				output: chatCompletion,
				instructions,
				additionalInstructions,
				tools,
			};
		},
		{
			experimentPrefix,
			data: dataset.name,
			client,
			evaluators,
			metadata: {
				agentVersion: agent.version,
				agentName: agent.name,
				model,
				temperature,
				maxTokens,
			},
		}
	);
};

export const runEvaluation = async (
	name,
	agents,
	dataset,
	model,
	service,
	apiKey,
	temperature,
	maxTokens
) => {
	// experimentPrefix is a slugified version of the project name
	const experimentPrefix = name.toLowerCase().replace( / /g, '_' );
	await createProject( name );
	await createChatDataset( dataset );
	const evaluationResults = [];

	for ( const agent of agents ) {
		const agentNameSlug = agent.name.toLowerCase().replace( / /g, '_' );
		const evaluationResult = await evaluateAgent(
			`${ experimentPrefix }-${ agentNameSlug }-v${ agent.version ?? '1' }`,
			agent,
			dataset,
			service,
			apiKey,
			model,
			temperature,
			maxTokens
		);
		/**
		 * [
		 *   {
		 *     "key": "has_site_title",
		 *     "score": true,
		 *     "sourceRunId": "f0ca35df-800e-4a10-8327-39409f9508cb"
		 *   },
		 *   //....
		 * ]
		 */
		const results = evaluationResult.results.map( ( result ) => {
			const exampleId = result.example.metadata.exampleId;
			const scores = {};
			console.warn( 'result', result.evaluationResults );
			result.evaluationResults.results.forEach( ( r ) => {
				scores[ r.key ] = r.score;
			} );
			return {
				exampleId,
				inputs: result.run.inputs,
				outputs: result.run.outputs,
				exampleOutputs: result.example.outputs,
				scores,
			};
		} );

		let nextResult = await evaluationResult.next();
		while ( ! nextResult.done ) {
			console.warn( 'result', nextResult );
			results.push( nextResult.value );
			nextResult = await evaluationResult.next();
		}
		evaluationResults.push( {
			agent: agent.name,
			version: agent.version,
			results,
		} );
	}

	return evaluationResults;
};
