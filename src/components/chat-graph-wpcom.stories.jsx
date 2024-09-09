import { WPCOMChatGraph } from './chat-graph-ui.jsx';

export default {
	title: 'Example/WPCOMChatGraph',
	component: WPCOMChatGraph,
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

const Template = ( args ) => <WPCOMChatGraph { ...args } />;

export const ChatGraphDemo = Template.bind( {} );

ChatGraphDemo.args = {
	// apiKey: import.meta.env.STORYBOOK_LANGCHAIN_API_KEY,
	baseUrl: import.meta.env.STORYBOOK_LANGGRAPH_CLOUD_BASE_URL,
	wpcomClientId: import.meta.env.STORYBOOK_WPCOM_CLIENT_ID,
	// wpcomOauthToken: import.meta.env.STORYBOOK_WPCOM_ACCESS_TOKEN,
	redirectUri: import.meta.env.STORYBOOK_WPCOM_REDIRECT_URI,
};
