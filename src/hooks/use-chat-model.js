/**
 * WordPress dependencies
 */
import { useEffect, useState } from 'react';

/**
 * Internal dependencies
 */
import ChatModel from '../ai/chat-model.js';
import log from '../utils/log-debug.js';

const useChatModel = ( { apiKey, service, feature, sessionId } ) => {
	const [ chatModel, setChatModel ] = useState();

	useEffect( () => {
		if (
			chatModel &&
			chatModel.service === service &&
			chatModel.apiKey === apiKey &&
			chatModel.feature === feature &&
			chatModel.sessionId === sessionId
		) {
			return;
		}
		if ( ! apiKey ) {
			return;
		}
		// eslint-disable-next-line no-console
		log.info( '🤖 Creating Chat Model', service, feature, sessionId );
		setChatModel(
			ChatModel.getInstance( service, apiKey, feature, sessionId )
		);
	}, [ apiKey, chatModel, service, feature, sessionId ] );

	return chatModel;
};

export default useChatModel;
