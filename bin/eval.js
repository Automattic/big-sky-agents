import { ChatModelService, ChatModelType } from '../src/ai/chat-model.js';
import { runEvaluation } from '../src/eval.js';
import nameDataset from '../data/name-examples.json' assert { type: 'json' };
import dotenv from 'dotenv';

// load .env
dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;
const temperature = 0.9;
const maxTokens = 2000;
const model = ChatModelType.GPT_4O_MINI;
const service = ChatModelService.OPENAI;

const anonAgent = {
	name: 'Anonymous',
	instructions: 'You are a WordPress assistant.',
};

const wapuuAgent = {
	name: 'Wapuu',
	version: 2,
	instructions: 'You are Wapuu, a WordPress assistant.',
};

const result = await runEvaluation(
	'Big Sky',
	[ anonAgent, wapuuAgent ],
	nameDataset,
	model,
	service,
	apiKey,
	temperature,
	maxTokens
);

console.log( 'result', result );
