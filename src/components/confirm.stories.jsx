import React from 'react';
import { fn } from '@storybook/test';

import Confirm from './confirm';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export

export default {
  title: 'Example/Confirm',
  component: Confirm,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    toolCallFunctionMessage: {
      control: 'text',
      table: { category: 'toolCall' },
      name: 'toolCall.function.arguments.message',
    },
  },
  decorators: [
    // This decorator translates the helpful argTypes above into what the component expects
    (Story, { args: { toolCallFunctionName, toolCallFunctionMessage, ...args } }) => {
      const toolCall = {
        type: 'function',
        function: {
          name: 'confirm',
          arguments: {
            message: toolCallFunctionMessage,
          },
        },
      };
      return <Story args={{ toolCall, ...args }} />
    }
  ]
};

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template = (args) => <Confirm {...args} />;

export const ConfirmExample = Template.bind({});

ConfirmExample.args = {
  toolCallFunctionMessage: 'Are you sure you want to do this?',
  onConfirm: fn(),
};
