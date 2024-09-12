import { WPCOMChatGraph } from './chat-graph-demo-ui';
import { ChatModelService } from '../ai/chat-model';

export default {
	title: 'Chat/Graph/WPCOM/Standard',
	component: WPCOMChatGraph,
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

const Template = ( args ) => <WPCOMChatGraph { ...args } />;

export const ChatGraphUIDemo = Template.bind( {} );

ChatGraphUIDemo.args = {
	service: ChatModelService.WPCOM_GRAPH,
	wpcomClientId: import.meta.env.STORYBOOK_WPCOM_CLIENT_ID,
	redirectUri: import.meta.env.STORYBOOK_WPCOM_REDIRECT_URI,
	stream: false,
};
