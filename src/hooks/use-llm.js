/**
 * WordPress dependencies
 */
import { useEffect, useState } from 'react';

/**
 * Internal dependencies
 */
import LLM from '../agents/llm.js';

const useLLM = ( { token, service } ) => {
	const [ llm, setLlm ] = useState();

	useEffect( () => {
		// when switching from something else to WPCOM, be sure to get the key
		if ( llm && llm.service === service && llm.apiKey === token ) {
			return;
		}
		// eslint-disable-next-line no-console
		console.log( '🤖 Creating LLM', service, token );
		setLlm(
			new LLM( {
				apiKey: token,
				service,
			} )
		);
	}, [ token, llm, service ] );

	return llm;
};

export default useLLM;
