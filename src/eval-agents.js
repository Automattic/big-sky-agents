#!/usr/bin/env node
import { loadDataset, runEvaluation } from './eval.js';
import { ChatModelService, ChatModelType } from './ai/chat-model.js';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import open from 'open';

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
		default: ChatModelType.GPT_4O_MINI,
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
	.option( 'json', {
		alias: 'j',
		type: 'boolean',
		description: 'Output in JSON format',
		default: false,
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

const writeHTMLReport = async ( evaluationOutput ) => {
	const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Evaluation Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        h1, h2, h3 {
            color: #2c3e50;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
        .score {
            font-weight: bold;
        }
        .true {
            color: green;
        }
        .false {
            color: red;
        }
        .report-link {
            display: inline-block;
            margin-top: 10px;
            padding: 10px 15px;
            background-color: #3498db;
            color: white;
            text-decoration: none;
            border-radius: 5px;
        }
        .report-link:hover {
            background-color: #2980b9;
        }
    </style>
</head>
<body>
    <h1>Evaluation Report</h1>

    ${ evaluationOutput.evaluationResults
		.map(
			( evaluationResult ) => `
        <h2>Agent: ${ evaluationResult.agent }</h2>
        <p>Version: ${ evaluationResult.metadata.version }</p>
        <table>
            <tr>
                <th>Example ID</th>
                <th>Evaluation</th>
                <th>Score</th>
            </tr>
            ${ evaluationResult.results
				.sort( ( a, b ) => a.exampleId - b.exampleId )
				.map(
					( example ) => `
                ${ example.results
					.map(
						( exampleResult ) => `
                    <tr>
                        <td>${ example.exampleId }</td>
                        <td>${ exampleResult.key }</td>
                        <td class="score ${ exampleResult.score }">${ exampleResult.score }</td>
                    </tr>
                `
					)
					.join( '' ) }
            `
				)
				.join( '' ) }
        </table>
        <h3>Summary Results</h3>
        <table>
            <tr>
                <th>Evaluation</th>
                <th>Score</th>
                <th>Comment</th>
            </tr>
            ${ evaluationResult.summaryResults
				.map(
					( summary ) => `
                <tr>
                    <td>${ summary.key }</td>
                    <td class="score">${ summary.score }</td>
                    <td>${ summary.comment }</td>
                </tr>
            `
				)
				.join( '' ) }
        </table>
        <a href="${
			evaluationResult.reportUrl
		}" class="report-link" target="_blank">View Detailed Report</a>
    `
		)
		.join( '' ) }

    <h2>Comparative Results</h2>
    <p>Experiment: ${ evaluationOutput.comparativeResult.experimentName }</p>
    <table>
        <tr>
            <th>Evaluation</th>
            <th>Scores</th>
        </tr>
        ${ evaluationOutput.comparativeResult.results
			.map(
				( comparativeResult ) => `
            <tr>
                <td>${ comparativeResult.key }</td>
                <td>
                    ${ Object.entries( comparativeResult.scores )
						.map(
							( [ id, score ] ) => `
                        ${ id }: ${ score }<br>
                    `
						)
						.join( '' ) }
                </td>
            </tr>
        `
			)
			.join( '' ) }
    </table>
    <a href="${
		evaluationOutput.reportUrl
	}" class="report-link" target="_blank">View Comparative Report</a>
</body>
</html>
  `;

	await fs.writeFile( 'eval.html', html );
	console.log( 'Report generated: eval.html' );
	await open( 'eval.html' );
};

if ( ! argv.json ) {
	writeHTMLReport( result );
} else {
	console.log( JSON.stringify( result, null, 2 ) );
}
