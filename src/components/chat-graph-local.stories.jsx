import ChatGraphUI from './chat-graph-ui.jsx';
import { ChatModelService } from '../ai/chat-model.js';

export default {
	title: 'Example/LocalChatGraph',
	component: ChatGraphUI,
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

const Template = ( args ) => <ChatGraphUI { ...args } />;

export const ChatGraphDemo = Template.bind( {} );

ChatGraphDemo.args = {
	service: ChatModelService.LOCAL_GRAPH,
	apiKey: 'none',
};
