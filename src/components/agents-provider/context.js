/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import createAgentRegistry from './agent-registry';

const defaultRegistry = createAgentRegistry();
export const Context = createContext( defaultRegistry );
const { Consumer, Provider } = Context;
export const ChatConsumer = Consumer;
export default Provider;
