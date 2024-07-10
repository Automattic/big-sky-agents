import BuilderAgent from './builder-agent.js';
import {
	SetSiteDescriptionTool,
	SetSiteLocationTool,
	SetSitePagesTool,
	SetSiteTitleTool,
	SetSiteTopicTool,
	SetSiteTypeTool,
} from '../tools/site-tools.js';
import { DotPromptTemplate } from '../prompt-template.js';
import { SITE_TOOLKIT_ID } from '../../hooks/use-site-toolkit.js';
import { ANALYZE_SITE_TOOLKIT_ID } from '../../hooks/use-analyze-site-toolkit.js';

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
	id = 'WPSiteSpec';
	name = 'Site Building Assistant';
	description = 'Here to help you update your site settings.';
	get toolkits() {
		return [ ...super.toolkits, ANALYZE_SITE_TOOLKIT_ID, SITE_TOOLKIT_ID ];
	}

	instructions( context ) {
		return instructions.format( context );
	}

	additionalInstructions( context ) {
		return additionalInstructions.format( context );
	}

	tools( context ) {
		return [
			...super.tools( context ),
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

	onStart( { askUser } ) {
		askUser( {
			question: defaultQuestion,
			choices: defaultChoices,
		} );
	}

	onConfirm( confirmed, { setGoal, informUser, askUser, userSay } ) {
		if ( confirmed ) {
			setGoal( { goal: 'Find out what the user wants to do next' } );
			informUser( { message: 'Got it!' } );
			askUser( {
				question: 'What would you like to do next?',
				choices: defaultChoices,
			} );
		} else {
			userSay( 'I would like to make some changes' );
			informUser( { message: 'Looks like you requested some changes' } );
			askUser( {
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
