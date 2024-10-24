const examples = {
	name: 'Wapuu Name Test',
	description:
		'Wapuu Name is a simple example of a Wapuu agent that responds to questions about its name.',
	data: [
		{
			id: '1',
			inputs: {
				context: {
					site: {
						siteTitle: 'Example Site',
					},
				},
				messages: [
					{
						role: 'assistant',
						content: 'How can I help you today?',
					},
					{
						role: 'user',
						content: 'What is your name?',
					},
				],
			},
			outputs: {
				message: {
					role: 'assistant',
					content: 'My name is Wapuu',
				},
			},
		},
		{
			id: '2',
			inputs: {
				messages: [
					{
						role: 'assistant',
						content: 'How can I help you today?',
					},
					{
						role: 'user',
						content: 'Who are you?',
					},
				],
			},
			outputs: {
				message: {
					role: 'assistant',
					content: 'My name is Wapuu',
				},
			},
		},
	],
	evaluators: [
		{
			key: 'has_wapuu_name',
			description: 'Has the name Wapuu',
			function: 'chat:includeString',
			arguments: {
				string: 'Wapuu',
			},
		},
	],
};

export default examples;
