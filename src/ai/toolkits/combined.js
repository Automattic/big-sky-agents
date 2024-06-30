import Toolkit from './toolkit.js';

class CombinedToolkit extends Toolkit {
	constructor( props ) {
		let state = {};
		props.toolkits.forEach( ( toolkit ) => {
			state = { ...state, ...toolkit.getState() };
		} );

		super( props, state );
	}

	onReset = () => {
		throw new Error( 'Not implemented' );
	};

	getTools = () => {
		return this.props.toolkits.reduce( ( tools, toolkit ) => {
			return [ ...tools, ...toolkit.tools() ];
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
