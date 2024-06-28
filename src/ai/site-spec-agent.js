import BuilderAgent from './agents/builder-agent.js';
import {
	SetSiteDescriptionTool,
	SetSiteLocationTool,
	SetSitePagesTool,
	SetSiteTitleTool,
	SetSiteTopicTool,
	SetSiteTypeTool,
} from './tools/site-tools.js';
import { WORDPRESS_SITE_SPEC_AGENT_ID } from './agents/default-agents.js';
import { DotPromptTemplate } from './prompt-template.js';

const defaultQuestion = 'What would you like to do with your site settings?';

const defaultChoices = [
	'Update the site title',
	'Update the site description',
	'Update the site topic',
	'Update the site location',
	'Update the site type',
	'Add a page',
];

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
 siteTitle: {{= it.site.title }},
 siteDescription: {{= it.site.description }},
 siteType: {{= it.site.type }},
 siteTopic: {{= it.site.topic }},
 siteLocation: {{= it.site.location }},
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
		return instructions.format( this.context );
	}

	getAdditionalInstructions() {
		return additionalInstructions.format( this.context );
	}

	getTools() {
		return [
			...super.getTools(),
			SetSiteTitleTool,
			SetSiteDescriptionTool,
			SetSiteTopicTool,
			SetSiteLocationTool,
			SetSiteTypeTool,
			SetSitePagesTool,
		];
	}

	getDefaultQuestion() {
		return defaultQuestion;
	}

	getDefaultChoices() {
		return defaultChoices;
	}

	onStart( tools ) {
		tools.askUser( {
			question: defaultQuestion,
			choices: defaultChoices,
		} );
	}

	onConfirm( confirmed, tools ) {
		if ( confirmed ) {
			tools.setGoal( 'Find out what the user wants to do next' );
			tools.informUser( 'Got it!' );
			tools.askUser( {
				question: 'What would you like to do next?',
				choices: defaultChoices,
			} );
		} else {
			tools.userSay( 'I would like to make some changes' );
			tools.informUser( 'Looks like you requested some changes' );
			tools.askUser( {
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
