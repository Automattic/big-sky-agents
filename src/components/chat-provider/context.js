/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as defaultChat } from '../../store/index.js';

export const Context = createContext( defaultChat );
const { Consumer, Provider } = Context;
export const ChatConsumer = Consumer;
export default Provider;
