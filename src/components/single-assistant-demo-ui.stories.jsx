import SingleAssistantDemoUI from './single-assistant-demo-ui';

export default {
	title: 'Features/Shared Toolkits',
	component: SingleAssistantDemoUI,
	argTypes: {
		apiKey: {
			control: 'text',
			name: 'OAuth API Key',
		},
	},
	decorators: [
		( Story ) => (
			<div style={ { minHeight: '600px' } }>
				<Story />
			</div>
		),
	],
};

const Template = ( args ) => <SingleAssistantDemoUI { ...args } />;

export const AssistantsDemoUIOpenAI = Template.bind( {} );

AssistantsDemoUIOpenAI.args = {
	apiKey: import.meta.env.STORYBOOK_OPENAI_API_KEY,
};
