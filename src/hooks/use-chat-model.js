/**
 * WordPress dependencies
 */
import { useEffect, useState } from 'react';

/**
 * Internal dependencies
 */
import ChatModel from '../agents/chat-model.js';

const useChatModel = ( { token, service, feature, sessionId } ) => {
	const [ chatModel, setChatModel ] = useState();

	useEffect( () => {
		if (
			chatModel &&
			chatModel.service === service &&
			chatModel.apiKey === token &&
			chatModel.feature === feature &&
			chatModel.sessionId === sessionId
		) {
			return;
		}
		if ( ! token ) {
			return;
		}
		// eslint-disable-next-line no-console
		console.log(
			'🤖 Creating Chat Model',
			service,
			token,
			feature,
			sessionId
		);
		setChatModel(
			ChatModel.getInstance( service, token, feature, sessionId )
		);
	}, [ token, chatModel, service, feature, sessionId ] );

	return chatModel;
};

export default useChatModel;
