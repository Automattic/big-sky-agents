import { ChatModelService, ChatModelType } from './src/ai/chat-model.js';
import dotenv from 'dotenv';
import {
	createChatDataset,
	createProject,
	evaluateAgent,
} from './eval/langsmith.js';
import nameDataset from './eval/name-examples.json' assert { type: 'json' };

// load .env
dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;
const temperature = 0.9;
const maxTokens = 2000;
const model = ChatModelType.GPT_4O_MINI;
const service = ChatModelService.OPENAI;

// const MLFLOW_API_URL = 'http://127.0.0.1:8081/api/2.0/mlflow';
const PROJECT_NAME = 'Big Sky';
const PROJECT_DESCRIPTION = 'Big Sky Project';
const DATASET_NAME = 'Wapuu Name Dataset 2';
const DATASET_DESCRIPTION = 'Does the agent have the correct name?';
const EXPERIMENT_PREFIX = 'big_sky_wapuu_name';

const anonAgent = {
	name: 'Anonymous',
	instructions: 'You are a WordPress assistant.',
};

const wapuuAgent = {
	name: 'Wapuu',
	version: 2,
	instructions: 'You are Wapuu, a WordPress assistant.',
};

await createProject( PROJECT_NAME, PROJECT_DESCRIPTION );
await createChatDataset( DATASET_NAME, DATASET_DESCRIPTION, nameDataset );

// evaluator
const hasWapuuName = async ( run, example ) => {
	return {
		key: 'has_wapuu_name',
		score: /Wapuu/.test( run.outputs?.output.content ),
	};
};

await evaluateAgent(
	EXPERIMENT_PREFIX,
	anonAgent,
	DATASET_NAME,
	[ hasWapuuName ],
	service,
	apiKey,
	model,
	temperature,
	maxTokens
);

await evaluateAgent(
	EXPERIMENT_PREFIX,
	wapuuAgent,
	DATASET_NAME,
	[ hasWapuuName ],
	service,
	apiKey,
	model,
	temperature,
	maxTokens
);
