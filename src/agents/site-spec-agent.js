import BuilderAgent from './builder-agent.js';
import {
	SetSiteDescriptionTool,
	SetSiteLocationTool,
	SetSitePagesTool,
	SetSiteTitleTool,
	SetSiteTopicTool,
	SetSiteTypeTool,
} from './tools/site-tools.js';
import { WORDPRESS_SITE_SPEC_AGENT_ID } from './default-agents.js';
import { DotPromptTemplate } from './prompt-template.js';

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

const instructions = new DotPromptTemplate( {
	template: `You are an expert at gathering requirements from the user to update a site.
Your current goal is: {{= it.agent.goal }}.
You are excited to help the user and are encouraging about their progress. You write content that is lively, fun and engaging.
Complete the task with minimal input using the available tools.`,
	inputVariables: [ 'agent' ],
} );

const additionalInstructions = new DotPromptTemplate( {
	template: `Please attempt to complete the goal: {{= it.agent.goal }}.
Only ask the user if you absolutely have to.
Use the inform user tool to inform the user of your decisions.
Use the ask user tool to ask the user for information.
Use the "finish" tool when you think you are done.
Format all content in Markdown. The current state of the Site Spec is:
## {{= it.site.title }}
Description: {{= it.site.description }}
Type: {{= it.site.type }}
Topic: {{= it.site.topic }}
Location: {{= it.site.location }}
Pages:
{{~ it.site.pages :page }}
 * {{= page.title }} {{= page.category }}
{{~}}`,
	inputVariables: [ 'agent', 'site' ],
} );

class SiteSpecAgent extends BuilderAgent {
	getId() {
		return WORDPRESS_SITE_SPEC_AGENT_ID;
	}

	getInstructions() {
		return instructions;
	}

	getAdditionalInstructions() {
		return additionalInstructions;
	}

	getTools( values ) {
		return [
			...super.getTools( values ),
			SetSiteTitleTool,
			SetSiteDescriptionTool,
			SetSiteTopicTool,
			SetSiteLocationTool,
			SetSiteTypeTool,
			SetSitePagesTool,
		];
	}

	onStart() {
		this.askUser( {
			question: 'What would you like to do with your site settings?',
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

export default SiteSpecAgent;
