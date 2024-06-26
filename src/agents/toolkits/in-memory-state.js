import Toolkit from './toolkit';
import InMemoryStateManager from '../state-managers/in-memory';

class InMemoryStateToolkit extends Toolkit {
	constructor( props, initialState ) {
		super( props );

		this.stateManager = new InMemoryStateManager( initialState );
	}
}

export default InMemoryStateToolkit;
