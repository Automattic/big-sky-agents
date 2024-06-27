class InMemoryStateManager {
	constructor( initialState ) {
		this.initialState = initialState;
		this.state = initialState;
	}

	getState = () => {
		return this.state;
	};

	setState = ( newState ) => {
		this.state = { ...this.state, ...newState };
	};

	resetState = () => {
		this.state = this.initialState;
	};
}

export default InMemoryStateManager;
