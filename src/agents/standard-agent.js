import Agent from './agent.js';
import AskUserTool from './tools/ask-user.js';
import InformUserTool from './tools/inform-user.js';
import SetGoalTool from './tools/set-goal.js';
import createSetAgentTool from './tools/set-agent.js';
import { FStringPromptTemplate } from './prompt-template.js';

const systemPrompt = FStringPromptTemplate.fromString(
	`You are a helpful assistant.`
);

const nextStepPrompt = FStringPromptTemplate.fromString(
	`Please attempt to complete the goal: {agent.goal}.`
);

class StandardAgent extends Agent {
	getTools( values ) {
		return [
			...super.getTools( values ),
			SetGoalTool,
			AskUserTool,
			createSetAgentTool( values.agents ),
		];
	}

	askUser( { question, choices } ) {
		this.call( AskUserTool.function.name, { question, choices } );
	}

	informUser( message ) {
		this.call( InformUserTool.function.name, { message } );
	}

	setGoal( goal ) {
		this.call( SetGoalTool.function.name, { goal } );
	}

	getSystemPrompt() {
		return systemPrompt;
	}

	getNextStepPrompt() {
		return nextStepPrompt;
	}
}

export default StandardAgent;
