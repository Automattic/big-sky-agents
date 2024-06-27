/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import createToolRegistry from './tool-registry';

const defaultRegistry = createToolRegistry();
export const Context = createContext( defaultRegistry );
const { Consumer, Provider } = Context;
export const ChatConsumer = Consumer;
export default Provider;
