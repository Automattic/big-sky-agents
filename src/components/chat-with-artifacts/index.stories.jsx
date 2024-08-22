import ChatWithArtifacts from './index.jsx';

export default {
	title: 'Example/ChatWithArtifacts',
	component: ChatWithArtifacts,
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

const Template = ( args ) => <ChatWithArtifacts { ...args } />;

export const ChatWithArtifactsDemo = Template.bind( {} );

ChatWithArtifactsDemo.args = {
	apiKey: import.meta.env.STORYBOOK_OPENAI_API_KEY,
};
