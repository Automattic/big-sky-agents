import AssistantsDemoUI from './assistants-demo-ui';
import { ChatModelType } from '../ai/chat-model';

export default {
	title: 'Assistants/OpenAI/Standard',
	component: AssistantsDemoUI,
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

const Template = ( args ) => <AssistantsDemoUI { ...args } />;

export const AssistantsDemoUIOpenAI = Template.bind( {} );

AssistantsDemoUIOpenAI.args = {
	apiKey: import.meta.env.STORYBOOK_OPENAI_API_KEY,
	provider: ChatModelType.OPENAI,
	stream: false,
};
