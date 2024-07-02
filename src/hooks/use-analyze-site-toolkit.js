/**
 * WordPress dependencies
 */
import { useEffect } from 'react';

/**
 * Internal dependencies
 */
import AnalyzeUrlTool, {
	makeAnalyzeUrlRequest,
} from '../ai/tools/analyze-url.js';

import useToolkits from '../components/toolkits-provider/use-toolkits.js';

const useAnalyzeSiteToolkit = ( { apiKey } ) => {
	// const { registerTool } = useTools();
	const { registerToolkit } = useToolkits();
	// register the tools
	// useEffect( () => {
	// 	registerTool( {
	// 		...AnalyzeUrlTool,
	// 		callback: ( { url } ) => {
	// 			return makeAnalyzeUrlRequest( { url, apiKey } );
	// 		},
	// 	} );
	// }, [ apiKey, registerTool ] );

	useEffect( () => {
		registerToolkit( {
			name: 'analyzeSite',
			tools: [ AnalyzeUrlTool ],
			callbacks: {
				[ AnalyzeUrlTool.name ]: ( { url } ) => {
					return makeAnalyzeUrlRequest( { url, apiKey } );
				},
			},
		} );
	}, [ apiKey, registerToolkit ] );
};

export default useAnalyzeSiteToolkit;
