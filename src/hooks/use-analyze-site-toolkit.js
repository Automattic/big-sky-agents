/**
 * WordPress dependencies
 */
import { useMemo } from 'react';

/**
 * Internal dependencies
 */
import AnalyzeUrlTool, {
	ANALYZE_URL_TOOL_NAME,
	makeAnalyzeUrlRequest,
} from '../agents/tools/analyze-url.js';

const values = {};

const useAnalyzeSiteToolkit = ( { apiKey } ) => {
	const callbacks = useMemo( () => {
		return {
			[ ANALYZE_URL_TOOL_NAME ]: ( { url } ) => {
				return makeAnalyzeUrlRequest( { url, apiKey } );
			},
		};
	}, [ apiKey ] );

	const tools = useMemo( () => {
		return [ AnalyzeUrlTool ];
	}, [] );

	return {
		tools,
		values,
		callbacks,
	};
};

export default useAnalyzeSiteToolkit;
