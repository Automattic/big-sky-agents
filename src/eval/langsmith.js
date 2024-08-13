import { Client } from 'langsmith';
import { evaluate } from 'langsmith/evaluation';
import ChatModel from '../ai/chat-model.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { deepEqual } from './evaluators/utils.js';
import { toOpenAITool } from '../ai/utils/openai.js';
import {
	compareContent,
	includeContext,
	includeString,
	matchRegex,
	matchToolCall,
} from './evaluators/chat.js';
dotenv.config();

const client = new Client();

// a class for registering and running evaluators
// e.g. Evaluators.register( 'chat:matchToolCall', matchToolCallEvaluator );
// e.g. Evaluators.get( 'chat:matchToolCall', 'my_field', { } )( 'matched_tool_call' )( run, example );
class Evaluators {
	static evaluators = {};

	static register( slug, evaluator ) {
		this.evaluators[ slug ] = evaluator;
	}

	static get( slug, key, args ) {
		if ( ! this.evaluators[ slug ] ) {
			throw new Error( `Evaluator ${ slug } not found.` );
		}
		return this.evaluators[ slug ]( key, args );
	}
}

Evaluators.register( 'chat:matchToolCall', matchToolCall );
Evaluators.register( 'chat:compareContent', compareContent );
Evaluators.register( 'chat:includeContext', includeContext );
Evaluators.register( 'chat:includeString', includeString );
Evaluators.register( 'chat:matchRegex', matchRegex );

export const createProject = async ( projectName, description ) => {
	if ( ! ( await client.hasProject( { projectName } ) ) ) {
		await client.createProject( {
			projectName,
			description,
		} );
	}
};

export const loadDataset = async ( datasetFilePath ) => {
	const fileExtension = path.extname( datasetFilePath );

	let dataset;
	try {
		if ( fileExtension === '.json' ) {
			const datasetContent = fs.readFileSync(
				path.resolve( datasetFilePath ),
				'utf-8'
			);
			dataset = JSON.parse( datasetContent );
		} else if ( fileExtension === '.js' ) {
			const modulePath = path.resolve( datasetFilePath );
			const module = await import( modulePath );
			dataset = module.default;
		} else {
			throw new Error(
				'Unsupported file type. Please provide a .json or .js file.'
			);
		}
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
			await client.createExample( example.inputs, example.outputs, {
				datasetId: datasetResult.id,
				metadata: {
					...metadata,
					exampleId: example.id,
				},
			} );
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
async function getEvaluators( evaluators ) {
	const parsedEvaluators = [];

	for ( const evaluator of evaluators ) {
		// const [ library, func ] = evaluator.function.split( ':' );
		// const modulePath = `./evaluators/${ library }.js`;
		parsedEvaluators.push(
			Evaluators.get(
				evaluator.function,
				evaluator.key,
				evaluator.arguments
			)
		);
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
	const agentMetadata = agent.metadata || {};
	const agentTags = agent.tags || [];
	const evaluators = await getEvaluators( dataset.evaluators );
	return await evaluate(
		async ( example ) => {
			const { messages, context = {} } = example;

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
				if ( agent.toolkits && Array.isArray( agent.toolkits ) ) {
					for ( const toolkit of agent.toolkits ) {
						const toolkitTools =
							typeof toolkit.tools === 'function'
								? toolkit.tools( context )
								: toolkit.tools;
						if ( toolkitTools && Array.isArray( toolkitTools ) ) {
							tools.push( ...toolkitTools );
						}
					}
				}
			}

			if ( agent.tools ) {
				const agentTools =
					typeof agent.tools === 'function'
						? agent.tools( context )
						: agent.tools;
				console.warn( 'agent tools', agent.tools, agentTools );
				if ( agentTools && Array.isArray( agentTools ) ) {
					tools.push( ...agentTools );
				}
			}

			const openAITools = tools.map( toOpenAITool );

			const message = await chatModel.run( {
				instructions,
				additionalInstructions,
				tools: openAITools,
				model,
				messages,
				temperature,
				maxTokens,
			} );
			return {
				message,
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
			tags: agentTags,
			metadata: {
				a8c_agent_name: agent.name,
				ls_model_name: model,
				ls_provider: service,
				ls_temperature: temperature,
				ls_max_tokens: maxTokens,
				ls_model_type: 'chat',
				...agentMetadata,
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
			`${ experimentPrefix }-${ agentNameSlug }-v${
				agent.metadata?.version ?? '1'
			}`,
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

		// let nextResult = await evaluationResult.next();
		// while ( ! nextResult.done ) {
		// 	results.push( nextResult.value );
		// 	nextResult = await evaluationResult.next();
		// }
		evaluationResults.push( {
			agent: agent.name,
			tags: agent.tags,
			metadata: agent.metadata,
			results,
		} );
	}

	return evaluationResults;
};
