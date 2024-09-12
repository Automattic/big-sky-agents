import AllInOneDemoUI from './all-in-one-demo-ui.jsx';

export default {
	title: 'Features/Standalone Chat',
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

export const AllInOneDemo = Template.bind( {} );

AllInOneDemo.args = {
	apiKey: import.meta.env.STORYBOOK_OPENAI_API_KEY,
};
