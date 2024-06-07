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

const useAnalyzeSiteToolkit = ( { token } ) => {
	const callbacks = useMemo( () => {
		return {
			[ ANALYZE_URL_TOOL_NAME ]: ( { url } ) => {
				return makeAnalyzeUrlRequest( { url, token } );
			},
		};
	}, [ token ] );

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
