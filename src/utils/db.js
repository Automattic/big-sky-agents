import { openDB } from 'idb';

const DB_NAME = 'big-sky-agents';
const STORE_NAME = 'chat';

async function initDB() {
	const db = await openDB( DB_NAME, 1, {
		upgrade( database ) {
			database.createObjectStore( STORE_NAME, {
				keyPath: [ 'threadId', 'id' ],
			} );
		},
	} );
	return db;
}

// export async function getFromDB( id ) {
// 	const db = await initDB();
// 	return await db.get( STORE_NAME, id );
// }

export async function loadThreadValue( threadId, id ) {
	const db = await initDB();
	return await db.get( STORE_NAME, [ threadId, id ] );
}

export async function saveThreadValue( threadId, id, value ) {
	const db = await initDB();
	await db.put( STORE_NAME, { id, threadId, value } );
}

export async function getAllFromDB() {
	const db = await initDB();
	return await db.getAll( STORE_NAME );
}

export const indexedDBMiddleware = ( store ) => ( next ) => ( action ) => {
	const result = next( action );
	const state = store.getState();
	if (
		[
			// messages
			'ADD_MESSAGE',
			'SET_MESSAGES',
		].includes( action.type )
	) {
		saveThreadValue( 'messages', state.root.messages );
	}

	if (
		[
			// threadRuns
			'GET_THREAD_RUN_END_REQUEST',
			'RUN_THREAD_END_REQUEST',
			'SUBMIT_TOOL_OUTPUTS_END_REQUEST',
		].includes( action.type )
	) {
		saveThreadValue( 'threadRuns', state.root.threadRuns );
	}

	return result;
};
