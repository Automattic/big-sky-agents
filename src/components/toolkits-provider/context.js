/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import createToolkitRegistry from './toolkit-registry';

const defaultRegistry = createToolkitRegistry();
export const Context = createContext( defaultRegistry );
const { Consumer, Provider } = Context;
export const ToolkitsConsumer = Consumer;
export default Provider;
