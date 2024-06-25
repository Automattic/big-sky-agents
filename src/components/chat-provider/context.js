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

/**
 * A custom react Context consumer exposing the provided `chat` to
 * children components. Used along with the ChatProvider.
 *
 * You can read more about the react context api here:
 * https://reactjs.org/docs/context.html#contextprovider
 *
 * @example
 * ```js
 * import {
 *   ChatProvider,
 *   ChatConsumer,
 *   createChat
 * } from '@automattic/big-sky-agents';
 *
 * const chat = createChat( {} );
 *
 * const App = ( { props } ) => {
 *   return <ChatProvider value={ chat }>
 *     <div>Hello There</div>
 *     <ChatConsumer>
 *       { ( chat ) => (
 *         <ComponentUsingChat
 *         		{ ...props }
 *         	  chat={ chat }
 *       ) }
 *     </ChatConsumer>
 *   </ChatProvider>
 * }
 * ```
 */
export const ChatConsumer = Consumer;

/**
 * A custom Context provider for exposing the provided `registry` to children
 * components via a consumer.
 */
export default Provider;
