import BuilderAgent from './builder-agent.js';
import {
	AddPageSectionTool,
	AddSitePageTool,
	SetPageCategoryTool,
	SetPageDescriptionTool,
	SetPageSectionsTool,
	SetPageTitleTool,
	SetSitePagesTool,
} from '../tools/site-tools.js';
import { DotPromptTemplate } from '../prompt-template.js';

const defaultChoices = [ 'Update the site description', 'Add a page' ];

const PageSpecPrompt = new DotPromptTemplate( {
	template: `## {{= it.title }}
Description: {{= it.description }}
Category: {{= it.category }}
Sections:
{{~ it.sections :section }}
 * {{= section.title }} ({{= section.category }})
{{~}}`,
	inputVariables: [ 'title', 'description', 'category', 'sections' ],
} );

const SystemPrompt = new DotPromptTemplate( {
	template: `You are an expert at gathering requirements from the user to update a web site or page.
Your current goal is: {{= it.agent.goal }}.
You are excited to help the user and are encouraging about their progress. You write content that is lively, fun and engaging.
Complete the task with minimal input using the available tools.`,
	inputVariables: [ 'agent' ],
} );

const NextStepPrompt = new DotPromptTemplate( {
	template: `Please attempt to complete the goal: {{= it.agent.goal }}.
Only ask the user if you absolutely have to.
Use the inform user tool to inform the user of your decisions.
Use the ask user tool to ask the user for information.
Use the "finish" tool when you think you are done.
Format all content in Markdown. The current state of the Page is:
{{= it.page }}`,
	inputVariables: [ 'agent', 'page' ],
	formatters: {
		page: PageSpecPrompt,
	},
} );

class PageSpecAgent extends BuilderAgent {
	id = 'WPPageSpec';
	name = 'Page Building Assistant';
	description = 'Here to help you update a page.';

	instructions( context ) {
		return SystemPrompt.format( context );
	}

	additionalInstructions( context ) {
		return NextStepPrompt.format( context );
	}

	tools( context ) {
		return [
			...super.tools( context ),
			// TODO: only enable these tools under certain conditions, e.g. only confirm when page is valid
			AddPageSectionTool,
			AddSitePageTool,
			SetPageCategoryTool,
			SetPageDescriptionTool,
			SetPageSectionsTool,
			SetPageTitleTool,
			SetSitePagesTool,
		];
	}

	onStart( invoke ) {
		invoke.askUser( {
			question: 'What would you like to do?',
			choices: defaultChoices,
		} );
	}

	onConfirm( confirmed, invoke ) {
		if ( confirmed ) {
			invoke.setGoal( 'Find out what the user wants to do next' );
			invoke.informUser( 'Got it!' );
			invoke.askUser( {
				question: 'What would you like to do next?',
				choices: defaultChoices,
			} );
		} else {
			invoke.userSay( 'I would like to make some changes' );
			invoke.informUser( 'Looks like you requested some changes' );
			invoke.askUser( {
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
