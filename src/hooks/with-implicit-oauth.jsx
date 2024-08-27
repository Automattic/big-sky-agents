import { useCallback, useEffect, useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { Button, Modal } from '@wordpress/components';
import wpOAuth from '../utils/implicit-oauth.js';
import { store as tokenStore } from '../store/index.js';

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
		...props
	} ) => {
		console.log( 'wpcomOauthTokenProp', wpcomOauthTokenProp );
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

		const {
			setWpcomOauthToken,
			setWpcomClientId,
			setWpcomOauthRedirectUri,
			setWpcomUserInfo,
		} = useDispatch( tokenStore );

		useEffect( () => {
			// Initialize wpOAuth
			if ( wpcomClientId ) {
				wpOAuth( wpcomClientId, {
					response_type: 'token',
					redirect: wpcomOauthRedirectUri,
					scope: 'global',
				} );
			}
		}, [ wpcomClientId, wpcomOauthRedirectUri ] );

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
					} );
			},
			[ setWpcomOauthToken, setWpcomUserInfo ]
		);

		const handleLogout = useCallback( () => {
			wpOAuth.clean();
			setLocalStorageItem( 'wp_user', null );
			setWpcomOauthToken( null );
			setWpcomUserInfo( null );
		}, [ setWpcomOauthToken, setWpcomUserInfo ] );

		// this occurs in a popup, so it's ok to close the window when done
		// it stores the token in OAUTH_TOKEN_KEY
		useEffect( () => {
			if ( ! wpcomClientId ) {
				return;
			}
			// Attempt to get the auth token - this will save the token in localstorage, where it's accessible by the parent
			wpOAuth.checkUrlForAccessToken( ( auth ) => {
				if ( auth && auth.access_token ) {
					// close the popup
					window.close();
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
			const response = wpOAuth.request();
			console.log( 'auth response', response );
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
					{ ...props }
				/>
				<p style={ { textAlign: 'center' } }>
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
				</p>
			</>
		);
	};
};

export default withImplicitOauth;
