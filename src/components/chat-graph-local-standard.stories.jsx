import ChatGraphDemoUI from './chat-graph-demo-ui.jsx';
import { ChatModelService } from '../ai/chat-model.js';

export default {
	title: 'Chat/Graph/Local/Standard',
	component: ChatGraphDemoUI,
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

const Template = ( args ) => <ChatGraphDemoUI { ...args } />;

export const ChatGraphDemo = Template.bind( {} );

ChatGraphDemo.args = {
	service: ChatModelService.LOCAL_GRAPH,
	apiKey: 'none',
	stream: false,
};
