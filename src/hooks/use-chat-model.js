/**
 * WordPress dependencies
 */
import { useEffect, useState } from 'react';

/**
 * Internal dependencies
 */
import ChatModel from '../agents/chat-model.js';

const useChatModel = ( { token, service } ) => {
	const [ chatModel, setChatModel ] = useState();

	useEffect( () => {
		if (
			chatModel &&
			chatModel.service === service &&
			chatModel.apiKey === token
		) {
			return;
		}
		if ( ! token ) {
			return;
		}
		// eslint-disable-next-line no-console
		console.log( '🤖 Creating Chat Model', service, token );
		setChatModel( ChatModel.getInstance( service, token ) );
	}, [ token, chatModel, service ] );

	return chatModel;
};

export default useChatModel;
