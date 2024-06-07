/**
 * WordPress dependencies
 */
import { useEffect, useState } from 'react';

/**
 * Internal dependencies
 */
import useJetpackToken from './use-jetpack-token.js';
import { ChatModelService } from '../agents/chat-model.js';

const useServiceAPIKey = ( service ) => {
	const { token: jetpackToken, isLoading, error } = useJetpackToken();
	const [ apiKey, setApiKey ] = useState( null );

	useEffect( () => {
		// otherwise wait for the Jetpack token, if it's WPCOM
		const defaultKey = ChatModelService.getDefaultApiKey( service );
		if ( service === 'wpcom' && jetpackToken ) {
			setApiKey( jetpackToken );
		} else if ( defaultKey ) {
			setApiKey( defaultKey );
		}
	}, [ service, jetpackToken ] );

	return { apiKey, isLoading, error };
};

export default useServiceAPIKey;
