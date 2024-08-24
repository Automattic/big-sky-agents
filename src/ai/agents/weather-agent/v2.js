const WeatherAgent = {
	id: 'weatherbot',
	name: 'Weather Bot',
	instructions: 'You are a helpful weather bot',
	additionalInstructions: ( context ) => {
		return `The user's current location is ${ context.currentLocation }.`;
	},
	metadata: {
		version: '2',
	},
	toolkits: [
		{
			name: 'weather',
			tools: [
				{
					name: 'getWeather',
					description: 'Get the weather for a location',
					parameters: {
						type: 'object',
						properties: {
							location: {
								type: 'string',
							},
						},
						required: [ 'location' ],
					},
					metadata: {
						version: '2',
					},
				},
			],
			callbacks: {
				getWeather: async ( { location } ) => {
					const response = await fetch(
						`https://wttr.in/${ location }?format=%C+%t`
					);
					const text = await response.text();
					return text;
				},
			},
		},
	],
	onStart: ( invoke ) => {
		console.warn( 'Weather Agent started' );
		invoke.agentSay( 'What location would you like the weather for?' );
	},
};

export default WeatherAgent;
