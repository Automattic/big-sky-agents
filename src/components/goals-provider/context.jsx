import { register } from '@wordpress/data';
import { createContext, useMemo } from '@wordpress/element';
import { store as defaultGoalsStore } from '../../store/index.js';
import { createGoalsStore } from '../../store/goals.js';
import uuidv4 from '../../utils/uuid.js';

export const Context = createContext( defaultGoalsStore );
const { Consumer, Provider } = Context;
export const AgentsConsumer = Consumer;

// Create a Map to store instances
const storeInstances = new Map();

function GoalsProvider( { children, ...options } ) {
	// Create a stable key for the current set of options
	const optionsKey = JSON.stringify( options );

	// Use useMemo to create or retrieve the store instance
	const store = useMemo( () => {
		if ( ! storeInstances.has( optionsKey ) ) {
			const newStore = createGoalsStore( `goals-${ uuidv4() }`, options );
			register( newStore );
			storeInstances.set( optionsKey, newStore );
		}
		return storeInstances.get( optionsKey );
	}, [ options, optionsKey ] );

	return <Provider value={ store }>{ children }</Provider>;
}

export default GoalsProvider;
