class Toolkit {
	constructor( props, initialState ) {
		this.props = props;
		this.state = initialState;
	}

	getState = () => {
		return this.state;
	};

	setState = ( newState ) => {
		this.state = { ...this.state, ...newState };
	};

	onReset = () => {
		throw new Error( 'Not implemented' );
	};

	getTools = () => {
		throw new Error( 'Not implemented' );
	};

	getValues = () => {
		throw new Error( 'Not implemented' );
	};

	// special override so that toolkit.values returns the result of toolkit.getValues()
	get values() {
		return this.getValues();
	}

	getCallbacks = () => {
		throw new Error( 'Not implemented' );
	};
}

export default Toolkit;
