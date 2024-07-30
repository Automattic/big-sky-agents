import {
	createChatDataset,
	createProject,
	evaluateAgent,
} from './eval/langsmith.js';

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
	console.warn( 'creating dataset', dataset );
	await createChatDataset( dataset );

	// evaluator
	const hasWapuuName = async ( run, example ) => {
		return {
			key: 'has_wapuu_name',
			score: /Wapuu/.test( run.outputs?.output.content ),
		};
	};

	for ( const agent of agents ) {
		await evaluateAgent(
			experimentPrefix,
			agent,
			dataset.name,
			[ hasWapuuName ],
			service,
			apiKey,
			model,
			temperature,
			maxTokens
		);
	}
};
