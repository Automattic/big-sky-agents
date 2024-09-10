import { WPCOMAssistantsDemoUI } from './assistants-demo-ui';
import { AssistantModelService } from '../ai/assistant-model';

export default {
	title: 'Assistants/WPCOM-Proxy/Stream',
	component: WPCOMAssistantsDemoUI,
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

const Template = ( args ) => <WPCOMAssistantsDemoUI { ...args } />;

export const WPCOMAssistantsDemo = Template.bind( {} );

WPCOMAssistantsDemo.args = {
	service: AssistantModelService.WPCOM_OPENAI,
	wpcomClientId: import.meta.env.STORYBOOK_WPCOM_CLIENT_ID,
	redirectUri: import.meta.env.STORYBOOK_WPCOM_REDIRECT_URI,
	stream: true,
};
