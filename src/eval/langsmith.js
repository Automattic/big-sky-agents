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
	const { name, description, examples, metadata = {} } = dataset;
	if ( ! ( await client.hasDataset( { datasetName: name } ) ) ) {
		const datasetResult = await client.createDataset( name, {
			data_type: 'chat',
			description,
		} );

		for ( const example of examples ) {
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

		// update examples by exampleId.
		for await ( const example of client.listExamples( {
			datasetId: datasetResult.id,
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
	return await evaluate(
		async ( example ) => {
			console.warn( 'input', example );
			const chatCompletion = await chatModel.run( {
				instructions: agent.instructions,
				model,
				messages: example.input,
				temperature,
				maxTokens,
			} );
			console.warn( 'output', chatCompletion );
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
