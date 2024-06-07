import React from 'react';

import AgentsDemoUI from './agents-demo-ui';

export default {
	title: 'Example/AgentsDemoUI',
	component: AgentsDemoUI,
	argTypes: {
		token: {
			control: 'text',
			name: 'API Token',
		},
	},
};

const Template = ( args ) => <AgentsDemoUI { ...args } />;

export const AgentsDemoUIOpenAI = Template.bind( {} );

AgentsDemoUIOpenAI.args = {
	token: import.meta.env.STORYBOOK_OPENAI_API_KEY,
};
