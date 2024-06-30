/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useMemo } from 'react';

/**
 * Internal dependencies
 */
import AnalyzeUrlTool, {
	makeAnalyzeUrlRequest,
} from '../ai/tools/analyze-url.js';

import useTools from '../components/tools-provider/use-tools.js';

const useAnalyzeSiteToolkit = ( { apiKey } ) => {
	const { registerTool } = useTools();
	// register the tools
	useEffect( () => {
		registerTool( {
			...AnalyzeUrlTool,
			callback: ( { url } ) => {
				return makeAnalyzeUrlRequest( { url, apiKey } );
			},
		} );
	}, [ apiKey, registerTool ] );
};

export default useAnalyzeSiteToolkit;
