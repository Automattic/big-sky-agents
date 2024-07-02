/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';
import { dispatch, register } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as defaultChat } from '../../store/index.js';
import { createChatStore } from '../../store/chat.js';
import uuidv4 from '../../utils/uuid.js';
import {
	AssistantModelService,
	AssistantModelType,
} from '../../ai/assistant-model.js';

// set up default chat store
dispatch( defaultChat ).setService( AssistantModelService.OPENAI );
dispatch( defaultChat ).setModel( AssistantModelType.GPT_4O );

export const Context = createContext( defaultChat );
const { Consumer, Provider } = Context;
export const ChatConsumer = Consumer;

function ChatProvider( { children, ...options } ) {
	const store = createChatStore( `chat-${ uuidv4() }`, options );
	register( store );
	return <Provider value={ store }>{ children }</Provider>;
}

export default ChatProvider;
