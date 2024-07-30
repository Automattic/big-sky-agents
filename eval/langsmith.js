import { Client } from 'langsmith';
import { evaluate } from 'langsmith/evaluation';
import ChatModel from '../src/ai/chat-model.js';
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

export const createChatDataset = async (
	datasetName,
	description,
	examples,
	metadata = {}
) => {
	if ( ! ( await client.hasDataset( { datasetName } ) ) ) {
		const dataset = await client.createDataset( datasetName, {
			data_type: 'chat',
			description,
		} );

		for ( const example of examples ) {
			await client.createExample(
				{ input: example.input },
				{ output: example.output },
				{
					datasetId: dataset.id,
					metadata: {
						...metadata,
						exampleId: example.id,
					},
				}
			);
		}
	} else {
		const dataset = await client.readDataset( { datasetName } );

		// update examples by exampleId.
		for await ( const example of client.listExamples( {
			datasetId: dataset.id,
		} ) ) {
			// look up from example using id
			const ex = examples.find(
				( e ) => e.id === example.metadata.exampleId
			);

			if ( ex ) {
				console.warn( `updating example ${ example.id }` );
				await client.updateExample( example.id, {
					inputs: { input: ex.input },
					outputs: { output: ex.output },
				} );
			}
		}
	}
};

export const evaluateAgent = async (
	experimentPrefix,
	agent,
	data,
	evaluators,
	service,
	apiKey,
	model,
	temperature,
	maxTokens
) => {
	const chatModel = ChatModel.getInstance( service, apiKey );

	await evaluate(
		async ( example ) => {
			console.warn( 'input', example );
			const chatCompletion = await chatModel.run( {
				instructions: agent.instructions,
				model,
				messages: example.input,
				temperature,
				maxTokens,
			} );
			console.warn( 'returning output', chatCompletion );
			return { output: chatCompletion };
		},
		{
			experimentPrefix: `${ experimentPrefix }-${ agent.name }`,
			data,
			evaluators,
			metadata: {
				agentVersion: agent.version,
				agentName: agent.name,
			},
		}
	);
};
