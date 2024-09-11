import { WPCOMChatDemoUI } from './chat-demo-ui';
import { ChatModelService } from '../ai/chat-model';
export default {
	title: 'Chat/WPCOM-Jetpack/Standard',
	component: WPCOMChatDemoUI,
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

const Template = ( args ) => <WPCOMChatDemoUI { ...args } />;

export const ChatDemoWPCOM = Template.bind( {} );

ChatDemoWPCOM.args = {
	service: ChatModelService.WPCOM_JETPACK_AI,
	wpcomSiteId: import.meta.env.STORYBOOK_WPCOM_BLOG_ID,
	wpcomClientId: import.meta.env.STORYBOOK_WPCOM_CLIENT_ID,
	redirectUri: import.meta.env.STORYBOOK_WPCOM_REDIRECT_URI,
	stream: false,
};
