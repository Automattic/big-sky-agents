/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Context } from './context';
export default function useAgents() {
	const agentRegistry = useContext( Context );

	return {
		agents: agentRegistry.getAgents(),
	}
}
