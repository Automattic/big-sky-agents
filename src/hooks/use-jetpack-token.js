import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from 'react';
import { store as authStore } from '../store/index.js'; // Ensure correct import

const useJetpackToken = () => {
	const { token, isLoading, error } = useSelect( ( select ) => {
		return {
			token: select( authStore ).getJetpackToken(),
			isLoading: select( authStore ).isLoading(),
			error: select( authStore ).getError(),
		};
	}, [] );

	const { fetchJetpackToken } = useDispatch( authStore );

	useEffect( () => {
		if ( ! token && ! isLoading && ! error ) {
			fetchJetpackToken();
		}
	}, [ token, isLoading, error, fetchJetpackToken ] );

	return { token, isLoading, error };
};

export default useJetpackToken;
