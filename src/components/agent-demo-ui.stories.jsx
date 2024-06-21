import React from 'react';

import AgentsDemoUI from './agents-demo-ui';

export default {
	title: 'Example/AgentsDemoUI',
	component: AgentsDemoUI,
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

const Template = ( args ) => <AgentsDemoUI { ...args } />;

export const AgentsDemoUIOpenAI = Template.bind( {} );

AgentsDemoUIOpenAI.args = {
	apiKey: import.meta.env.STORYBOOK_OPENAI_API_KEY,
};
