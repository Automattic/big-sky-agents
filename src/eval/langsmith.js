import { Client } from 'langsmith';
import { evaluate } from 'langsmith/evaluation';
import ChatModel from '../ai/chat-model.js';
import dotenv from 'dotenv';
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
			existingExampleIds.add( remoteExample.metadata.exampleId );

			// Look up from example using id
			const example = data.find(
				( e ) => e.id === remoteExample.metadata.exampleId
			);

			if ( example ) {
				console.warn( `updating example ${ remoteExample.id }` );
				await client.updateExample( remoteExample.id, {
					inputs: { context: example.context, input: example.input },
					outputs: { output: example.output },
				} );
			} else {
				console.warn( `deleting example ${ remoteExample.id }` );
				await client.deleteExample( remoteExample.id );
			}
		}

		// Add new examples that do not exist in the dataset
		for ( const example of data ) {
			if ( ! existingExampleIds.has( example.id ) ) {
				console.warn( `creating new example ${ example.id }` );
				await client.createExample(
					{ input: example.input, context: example.context },
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
			const { input: messages, context } = example;

			const instructions =
				typeof agent.instructions === 'function'
					? agent.instructions( context )
					: agent.instructions;

			const chatCompletion = await chatModel.run( {
				instructions,
				model,
				messages,
				temperature,
				maxTokens,
			} );
			return { output: chatCompletion, instructions };
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
		const evaluationResult = await evaluateAgent(
			`${ experimentPrefix }-${ agent.name }`,
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
