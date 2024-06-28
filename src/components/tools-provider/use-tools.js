/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Context } from './context.jsx';
export default function useTools() {
	return useContext( Context );
}
