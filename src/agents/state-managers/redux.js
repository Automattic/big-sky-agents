class ReduxStateManager {
	constructor( getter, setter, resetter ) {
		this.getter = getter;
		this.setter = setter;
		this.resetter = resetter;
	}

	getState = () => {
		return this.getter();
	};

	setState = ( newState ) => {
		this.setter( newState );
	};

	resetState = () => {
		this.resetter();
	};
}

export default ReduxStateManager;
