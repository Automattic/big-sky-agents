import ChatGraphUI from './chat-graph-ui';

export default {
	title: 'Example/ChatGraph - Stream',
	component: ChatGraphUI,
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

const Template = ( args ) => <ChatGraphUI { ...args } />;

export const ChatGraphUIDemo = Template.bind( {} );

ChatGraphUIDemo.args = {
	apiKey: import.meta.env.STORYBOOK_OPENAI_API_KEY,
	stream: true,
};
