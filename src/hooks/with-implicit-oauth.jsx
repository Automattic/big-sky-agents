import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { Button, Modal } from '@wordpress/components';
import wpOAuth from '../utils/implicit-oauth.js';
import { store as tokenStore } from '../store/index.js';
import { ChatModelService } from '../ai/chat-model.js';
import './with-implicit-oauth.scss';

// Utility functions to handle localStorage
const setLocalStorageItem = ( key, value ) => {
	localStorage.setItem( key, JSON.stringify( value ) );
};

const getLocalStorageItem = ( key ) => {
	const item = localStorage.getItem( key );
	return item ? JSON.parse( item ) : null;
};

const withImplicitOauth = ( Component ) => {
	return ( {
		wpcomClientId: wpcomClientIdProp,
		redirectUri: redirectUriProp,
		wpcomOauthToken: wpcomOauthTokenProp,
		service,
		...props
	} ) => {
		const cachedUser = useMemo(
			() => getLocalStorageItem( 'wp_user' ),
			[]
		);

		// const service = useSelect( ( select ) =>
		// 	select( tokenStore ).getService()
		// );

		const [ isAuthenticating, setIsAuthenticating ] = useState( false );
		const {
			wpcomUserInfo,
			wpcomOauthToken,
			wpcomClientId,
			wpcomOauthRedirectUri,
		} = useSelect( ( select ) => {
			return {
				wpcomUserInfo: select( tokenStore ).getWpcomUserInfo(),
				wpcomOauthToken: select( tokenStore ).getWpcomOauthToken(),
				wpcomClientId: select( tokenStore ).getWpcomClientId(),
				wpcomOauthRedirectUri:
					select( tokenStore ).getWpcomOauthRedirectUri(),
			};
		} );
		const scope = useMemo( () => {
			// if the service is WPCOM Jetpack, use blog scope, otherwise global
			return service === ChatModelService.WPCOM_JETPACK_AI
				? 'auth users sites posts comments read'
				: 'global';
		}, [ service ] );

		const {
			setWpcomOauthToken,
			setWpcomClientId,
			setWpcomOauthRedirectUri,
			setWpcomUserInfo,
		} = useDispatch( tokenStore );

		// set default from props
		useEffect( () => {
			if ( wpcomClientIdProp ) {
				setWpcomClientId( wpcomClientIdProp );
			}
		}, [ wpcomClientIdProp, setWpcomClientId ] );

		useEffect( () => {
			if ( wpcomOauthTokenProp ) {
				setWpcomOauthToken( wpcomOauthTokenProp );
			}
		}, [ wpcomOauthTokenProp, setWpcomOauthToken ] );

		useEffect( () => {
			// Initialize wpOAuth
			if ( wpcomClientId ) {
				wpOAuth( wpcomClientId, {
					response_type: 'token',
					redirect: wpcomOauthRedirectUri,
					scope,
				} );
			}
		}, [ wpcomClientId, wpcomOauthRedirectUri, scope ] );

		useEffect( () => {
			if ( cachedUser && ! wpcomUserInfo ) {
				setWpcomUserInfo( cachedUser );
			}
		}, [ cachedUser, setWpcomUserInfo, wpcomUserInfo ] );

		const handleLogout = useCallback( () => {
			wpOAuth.clean();
			setLocalStorageItem( 'wp_user', null );
			setWpcomOauthToken( null );
			setWpcomUserInfo( null );
		}, [ setWpcomOauthToken, setWpcomUserInfo ] );

		const fetchUser = useCallback(
			( accessToken ) => {
				fetch( 'https://public-api.wordpress.com/rest/v1.1/me', {
					headers: {
						Authorization: `Bearer ${ accessToken }`,
					},
				} )
					.then( ( response ) => response.json() )
					.then( ( userData ) => {
						if ( userData.error ) {
							setWpcomOauthToken( null );
							wpOAuth.clean();
							setLocalStorageItem( 'wp_user', null );
							console.error(
								'Error fetching user data:',
								userData.error
							);
							return;
						}
						setLocalStorageItem( 'wp_user', userData );
						setWpcomUserInfo( userData );
					} )
					.catch( ( error ) => {
						console.error( 'Error fetching user data:', error );
						handleLogout();
					} );
			},
			[ setWpcomOauthToken, setWpcomUserInfo, handleLogout ]
		);

		// this occurs in a popup, so it's ok to close the window when done
		// it stores the token in OAUTH_TOKEN_KEY
		useEffect( () => {
			if ( ! wpcomClientId ) {
				console.warn( 'no wpcomClientId' );
				return;
			}
			// Attempt to get the auth token - this will save the token in localstorage, where it's accessible by the parent
			wpOAuth.checkUrlForAccessToken( ( auth ) => {
				if ( auth && auth.access_token ) {
					// close the popup
					if ( window.parent ) {
						window.parent.close();
					} else {
						window.close();
					}
				}
			} );
		}, [ wpcomClientId, setWpcomOauthToken ] );

		useEffect( () => {
			if ( redirectUriProp ) {
				setWpcomOauthRedirectUri( redirectUriProp );
			}
		}, [ redirectUriProp, setWpcomOauthRedirectUri ] );

		// set token if available
		useEffect( () => {
			if ( wpcomClientId && ! wpcomOauthToken ) {
				const checkToken = setInterval( () => {
					const token = wpOAuth.token();
					if ( token ) {
						setWpcomOauthToken( token.access_token );
						clearInterval( checkToken );
					}
					setIsAuthenticating( false );
				}, 500 );

				return () => clearInterval( checkToken );
			}
		}, [ wpcomOauthToken, setWpcomOauthToken, wpcomClientId ] );

		// call fetchUser once we have our token
		useEffect( () => {
			if ( ! wpcomUserInfo && wpcomOauthToken ) {
				fetchUser( wpcomOauthToken );
			}
		}, [ wpcomOauthToken, fetchUser, wpcomUserInfo ] );

		const handleAuth = useCallback( () => {
			setIsAuthenticating( true );
			wpOAuth.request();
		}, [] );

		if ( ! wpcomClientId ) {
			return <p>No client ID set</p>;
		}

		if ( ! wpcomOauthToken && ! isAuthenticating ) {
			return (
				<Modal size="small" __experimentalHideHeader={ true }>
					<Button variant="primary" onClick={ handleAuth }>
						Connect to WordPress.com
					</Button>
				</Modal>
			);
		}

		if ( isAuthenticating ) {
			return <p>Authenticating...</p>;
		}

		if ( ! wpcomUserInfo ) {
			return <p>Loading user data</p>;
		}

		return (
			<>
				<Component
					wpcomOauthToken={ wpcomOauthToken }
					user={ wpcomUserInfo }
					service={ service }
					{ ...props }
				/>
				<div className="big-sky__oauth-user-info">
					<img
						style={ { width: '24px', verticalAlign: 'middle' } }
						src={ wpcomUserInfo.avatar_URL }
						alt={ wpcomUserInfo.display_name }
					/>{ ' ' }
					{ wpcomUserInfo.display_name }&nbsp;
					<Button
						variant="secondary"
						size="small"
						onClick={ handleLogout }
					>
						Logout
					</Button>
				</div>
			</>
		);
	};
};

export default withImplicitOauth;
