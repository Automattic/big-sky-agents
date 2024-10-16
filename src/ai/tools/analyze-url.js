export const ANALYZE_URL_TOOL_NAME = 'analyzeUrl';

/**
 * Note that this endpoint is Automattician-only
 */

export const makeAnalyzeUrlRequest = async ( { url, apiKey } ) => {
	const response = await fetch(
		'https://public-api.wordpress.com/wpcom/v2/analyze-url/describe',
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${ apiKey }`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify( { url } ),
		}
	);
	if ( ! response.ok ) {
		throw new Error( 'Failed to analyze URL' );
	}
	const data = await response.json();
	if ( data.error ) {
		throw new Error( data.error );
	}
	return JSON.stringify( data );
};

export default {
	name: ANALYZE_URL_TOOL_NAME,
	description:
		'Analyze a remote site to extract sections, colors, fonts, layout, metadata, content, and other elements.',
	parameters: {
		type: 'object',
		properties: {
			url: {
				description:
					'The URL of the site to analyze. Always use https:// URLs for security.',
				type: 'string',
			},
		},
		required: [ 'url' ],
	},
};
