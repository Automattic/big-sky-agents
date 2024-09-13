import ChatWithGutenberg from './index.jsx';

export default {
	title: 'Features/Gutenberg/Direct/Stream',
	component: ChatWithGutenberg,
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

const Template = ( args ) => <ChatWithGutenberg { ...args } />;

export const ChatWithArtifactsDemo = Template.bind( {} );

ChatWithArtifactsDemo.args = {
	stream: true,
	apiKey: import.meta.env.STORYBOOK_LANGCHAIN_API_KEY,
	baseUrl: import.meta.env.STORYBOOK_LANGGRAPH_CLOUD_BASE_URL,
};
