import Toolkit from './toolkit.js';
import InMemoryStateManager from '../state-managers/in-memory.js';

class CombinedToolkit extends Toolkit {
	constructor( props ) {
		let state = {};
		props.toolkits.forEach( ( toolkit ) => {
			state = { ...state, ...toolkit.stateManager.getState() };
		} );

		super( props, new InMemoryStateManager( state ) );
	}

	onReset = () => {
		throw new Error( 'Not implemented' );
	};

	getTools = () => {
		return this.props.toolkits.reduce( ( tools, toolkit ) => {
			return [ ...tools, ...toolkit.getTools() ];
		}, [] );
	};

	getValues = () => {
		return this.props.toolkits.reduce( ( values, toolkit ) => {
			return { ...values, ...toolkit.getValues() };
		}, {} );
	};

	getCallbacks = () => {
		return this.props.toolkits.reduce( ( callbacks, toolkit ) => {
			return { ...callbacks, ...toolkit.getCallbacks() };
		}, {} );
	};
}

export default CombinedToolkit;
