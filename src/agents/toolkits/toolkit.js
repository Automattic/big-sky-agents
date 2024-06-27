class Toolkit {
	constructor( props, stateManager ) {
		this.props = props;
		this.stateManager = stateManager;
	}

	get state() {
		return this.stateManager.getState();
	}

	setState = ( newState ) => {
		this.stateManager.setState( newState );
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
