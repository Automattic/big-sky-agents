import StandardAgent from './standard-agent.js';
import { ANALYZE_URL_TOOL_NAME } from './tools/analyze-url.js';
import { CONFIRM_TOOL_NAME } from './tools/confirm.js';
import {
	ADD_SITE_PAGE_TOOL_NAME,
	SET_SITE_DESCRIPTION_TOOL_NAME,
	SET_SITE_LOCATION_TOOL_NAME,
	SET_SITE_PAGES_TOOL_NAME,
	SET_SITE_TITLE_TOOL_NAME,
	SET_SITE_TOPIC_TOOL_NAME,
	SET_SITE_TYPE_TOOL_NAME,
} from './tools/site-tools.js';
import { WORDPRESS_SITE_SPEC_AGENT_ID } from './default-agents.js';
import { DotPromptTemplate, FStringPromptTemplate } from './prompt-template.js';

const defaultChoices = [ 'Update the site description', 'Add a page' ];

const SiteSpecPrompt = new DotPromptTemplate( {
	template: `## {{= it.title }}
Description: {{= it.description }}
Type: {{= it.type }}
Topic: {{= it.topic }}
Location: {{= it.location }}
Pages:
{{~ it.pages :page }}
 * {{= page.title }} {{= page.category }}
{{~}}`,
	inputVariables: [
		'title',
		'description',
		'type',
		'topic',
		'location',
		'pages',
	],
} );

const systemPrompt = new FStringPromptTemplate( {
	template: `You are an expert at gathering requirements from the user to update a site.
Your current goal is: {agentGoal}.
You are excited to help the user and are encouraging about their progress. You write content that is lively, fun and engaging.
Complete the task with minimal input using the available tools.`,
} );

const nextStepPrompt = new FStringPromptTemplate( {
	template: `Please attempt to complete the goal: {agent.goal}.
Only ask the user if you absolutely have to.
Use the inform user tool to inform the user of your decisions.
Use the ask user tool to ask the user for information.
Use the "finish" tool when you think you are done.
Format all content in Markdown. The current state of the Site Spec is:
{site}`,
	formatters: {
		site: SiteSpecPrompt,
	},
} );

class PageSpecAgent extends StandardAgent {
	getId() {
		return WORDPRESS_SITE_SPEC_AGENT_ID;
	}

	getSystemPrompt() {
		return systemPrompt;
	}

	getNextStepPrompt() {
		return nextStepPrompt;
	}

	getTools( values ) {
		return [
			...super.getTools( values ),
			...super.findTools(
				ANALYZE_URL_TOOL_NAME,
				CONFIRM_TOOL_NAME,
				SET_SITE_TITLE_TOOL_NAME,
				SET_SITE_DESCRIPTION_TOOL_NAME,
				SET_SITE_TOPIC_TOOL_NAME,
				SET_SITE_LOCATION_TOOL_NAME,
				SET_SITE_TYPE_TOOL_NAME,
				SET_SITE_PAGES_TOOL_NAME,
				ADD_SITE_PAGE_TOOL_NAME
			),
		];
	}

	onStart() {
		this.askUser( {
			question: 'What would you like to do?',
			choices: defaultChoices,
		} );
	}

	onConfirm( confirmed ) {
		if ( confirmed ) {
			this.setGoal( 'Find out what the user wants to do next' );
			this.informUser( 'Got it!' );
			this.askUser( {
				question: 'What would you like to do next?',
				choices: defaultChoices,
			} );
		} else {
			this.userSay( 'I would like to make some changes' );
			this.informUser( 'Looks like you requested some changes' );
			this.askUser( {
				question: 'What would you like to change?',
				choices: [
					'Change the title',
					'Change the description',
					'Change the category',
					'Add a section',
				],
			} );
		}
	}
}

export default PageSpecAgent;
