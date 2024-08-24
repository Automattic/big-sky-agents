import ChatDemoUI from './chat-demo-ui';

export default {
	title: 'Example/ChatDemoUI',
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
};
