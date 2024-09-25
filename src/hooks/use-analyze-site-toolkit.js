/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import AnalyzeUrlTool, {
	makeAnalyzeUrlRequest,
} from '../ai/tools/analyze-url.js';

import useToolkits from '../components/toolkits-provider/use-toolkits.js';

export const ANALYZE_SITE_TOOLKIT_ID = 'analyzeSite';

const useAnalyzeSiteToolkit = ( { apiKey } ) => {
	const { registerToolkit } = useToolkits();

	useEffect( () => {
		registerToolkit( {
			name: ANALYZE_SITE_TOOLKIT_ID,
			tools: [ AnalyzeUrlTool ],
			callbacks: {
				[ AnalyzeUrlTool.name ]: async ( { url } ) => {
					try {
						return await makeAnalyzeUrlRequest( { url, apiKey } );
					} catch ( error ) {
						console.error( 'Error analyzing URL:', error );
						return 'Error analyzing URL';
					}
				},
			},
		} );
	}, [ apiKey, registerToolkit ] );
};

export default useAnalyzeSiteToolkit;
