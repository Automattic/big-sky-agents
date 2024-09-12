import { fn } from '@storybook/test';

import { Confirm } from './confirm';

export default {
	title: 'Components/Confirm',
	component: Confirm,
	argTypes: {
		confirmMessage: {
			control: 'text',
			table: { category: 'toolCall' },
			name: 'args.message',
		},
	},
};

const Template = ( args ) => (
	<Confirm
		args={ { message: args.confirmMessage } }
		onConfirm={ args.onConfirm }
		respond={ args.respond }
	/>
);

export const ConfirmExample = Template.bind( {} );

ConfirmExample.args = {
	confirmMessage: 'Are you sure you want to do this?',
	onConfirm: fn(),
	respond: fn(),
};
