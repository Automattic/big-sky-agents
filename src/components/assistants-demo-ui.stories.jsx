import React from 'react';

import AssistantsDemoUI from './assistants-demo-ui';

export default {
	title: 'Example/AssistantsDemoUI',
	component: AssistantsDemoUI,
	argTypes: {
		apiKey: {
			control: 'text',
			name: 'OAuth API Key',
		},
	},
};

const Template = ( args ) => <AssistantsDemoUI { ...args } />;

export const AssistantsDemoUIOpenAI = Template.bind( {} );

AssistantsDemoUIOpenAI.args = {
	apiKey: import.meta.env.STORYBOOK_OPENAI_API_KEY,
};
