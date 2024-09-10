import { WPCOMChatGraph } from './chat-graph-ui.jsx';
import { ChatModelService } from '../ai/chat-model.js';

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
	service: ChatModelService.WPCOM_GRAPH,
	wpcomClientId: import.meta.env.STORYBOOK_WPCOM_CLIENT_ID,
	redirectUri: import.meta.env.STORYBOOK_WPCOM_REDIRECT_URI,
};
