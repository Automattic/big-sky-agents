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
export const ToolsConsumer = Consumer;
export default Provider;
