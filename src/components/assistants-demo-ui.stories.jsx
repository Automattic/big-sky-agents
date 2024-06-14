import React from 'react';

import AssistantsDemoUI from './assistants-demo-ui';

export default {
	title: 'Example/AssistantsDemoUI',
	component: AssistantsDemoUI,
	argTypes: {
		token: {
			control: 'text',
			name: 'API Token',
		},
	},
};

const Template = ( args ) => <AssistantsDemoUI { ...args } />;

export const AssistantsDemoUIOpenAI = Template.bind( {} );

AssistantsDemoUIOpenAI.args = {
	token: import.meta.env.STORYBOOK_OPENAI_API_KEY,
};
