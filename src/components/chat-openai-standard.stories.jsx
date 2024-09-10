import ChatDemoUI from './chat-demo-ui';
import { ChatModelService } from '../ai/chat-model';
export default {
	title: 'Chat/OpenAI/Standard',
	component: ChatDemoUI,
	argTypes: {
		apiKey: {
			control: 'text',
			name: 'OAuth Bearer Token',
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

const Template = ( args ) => <ChatDemoUI { ...args } />;

export const ChatDemoUIOpenAI = Template.bind( {} );

ChatDemoUIOpenAI.args = {
	apiKey: import.meta.env.STORYBOOK_OPENAI_API_KEY,
	provider: ChatModelService.OPENAI,
	stream: false,
};
