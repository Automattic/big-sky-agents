import React from 'react';

import AllInOneDemoUI from './all-in-one-demo-ui.jsx';

export default {
	title: 'Example/AllInOneDemoUI',
	component: AllInOneDemoUI,
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

const Template = ( args ) => <AllInOneDemoUI { ...args } />;

export const AssistantsDemoUIOpenAI = Template.bind( {} );

AssistantsDemoUIOpenAI.args = {
	apiKey: import.meta.env.STORYBOOK_OPENAI_API_KEY,
};
