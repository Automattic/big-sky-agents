/**
 * Module dependencies.
 */

/**
 * Authorize WordPress.com endpoint
 */

const authorizeEndpoint = 'https://public-api.wordpress.com/oauth2/authorize';

const debug = ( ...args ) => {
	console.log( ...args );
};

const OAUTH_TOKEN_KEY = 'wp_oauth';

/**
 * Expose `wpOAuth` function
 */

function wpOAuth( client_id, opts ) {
	// `Client ID` must be defined
	if ( ! client_id ) {
		throw '`client_id` is undefined';
	}
	debug( 'client_id: %o', client_id );

	// options
	opts = opts || {};

	// authentication request params
	const params = ( wpOAuth.params = {
		client_id,
		blog: opts.blog,
		response_type: opts.response_type || 'token',
	} );

	// include state if in opts
	if ( opts.hasOwnProperty( 'state' ) ) {
		params.state = opts.state;
	}

	// options - `Redirect URL`
	params.redirect_uri =
		opts.redirect || wpOAuth.getCurrentUrl().replace( /\#.*$/, '' );
	debug( 'Redirect_URL: %o', params.redirect_uri );

	if ( opts.scope ) {
		params.scope = opts.scope;
	}

	return wpOAuth;
}

export default wpOAuth;

/**
 * Keep a local cache in case localStorage is not available
 */
const localCache = {};

/**
 * Returns current localStorage value for a key
 *
 * @param {string} key
 */

wpOAuth.getLocalStorageValue = function ( key ) {
	if ( typeof localStorage !== 'undefined' ) {
		return localStorage.getItem( key );
	}
	return localCache[ key ];
};

/**
 * Saves new key-value pair to localStorage
 *
 * @param {string} key
 * @param {Object} value
 */

wpOAuth.setLocalStorageValue = function ( key, value ) {
	if ( typeof localStorage !== 'undefined' ) {
		localStorage.setItem( key, value );
	}
	localCache[ key ] = value;
};

/**
 * Returns current browser window URL as a string
 *
 */

wpOAuth.getCurrentUrl = function () {
	if ( typeof window !== 'undefined' ) {
		return window.location.href;
	}
	return '';
};

/**
 * Changes current browser window URL
 *
 * @param {string} url
 */

wpOAuth.setCurrentUrl = function ( url ) {
	if ( typeof window !== 'undefined' ) {
		window.location = url;
	}
};

/**
 * Get token authentication object
 *
 * @param {Function} [fn]
 */

wpOAuth.checkUrlForAccessToken = function ( fn ) {
	fn = fn || function () {};

	// get url parsed object
	const url_parsed = new URL( wpOAuth.getCurrentUrl() );

	// get hash object
	let hash;
	if ( url_parsed.hash && url_parsed.hash.length > 1 ) {
		// Use browser native function to parse the hash
		if ( typeof URLSearchParams !== 'undefined' ) {
			const searchParams = new URLSearchParams(
				url_parsed.hash.substring( 1 )
			);
			hash = Object.fromEntries( searchParams.entries() );
		}
	}

	const existingStorageValue =
		wpOAuth.getLocalStorageValue( OAUTH_TOKEN_KEY );

	if ( hash && hash.access_token ) {
		// Token is present in current URI
		// store access_token
		wpOAuth.setLocalStorageValue( OAUTH_TOKEN_KEY, JSON.stringify( hash ) );

		// clean hash from current URI
		// wpOAuth.setCurrentUrl(wpOAuth.getCurrentUrl().replace(/\#.*$/, ""));
	} else if ( ! existingStorageValue || existingStorageValue === 'null' ) {
		return null;
	}

	fn( JSON.parse( wpOAuth.getLocalStorageValue( OAUTH_TOKEN_KEY ) ) );
};


/**
 * Clean authentication from store
 *
 */

wpOAuth.clean = function () {
	debug( 'clean' );
	wpOAuth.setLocalStorageValue( OAUTH_TOKEN_KEY, null );
};

/**
 * Make WordPress.com implicit oauth request
 *
 */

wpOAuth.request = function () {
	// Create the OAuth URL
	const redirect = new URL( authorizeEndpoint );
	redirect.searchParams.set( 'client_id', wpOAuth.params.client_id );
	if ( wpOAuth.params.blog ) {
		redirect.searchParams.set( 'blog', wpOAuth.params.blog );
	}

	redirect.searchParams.set( 'response_type', wpOAuth.params.response_type );
	if ( wpOAuth.params.hasOwnProperty( 'state' ) ) {
		redirect.searchParams.set( 'state', wpOAuth.params.state );
	}
	redirect.searchParams.set( 'redirect_uri', wpOAuth.params.redirect_uri );
	if ( wpOAuth.params.scope ) {
		redirect.searchParams.set( 'scope', wpOAuth.params.scope );
	}

	debug( 'Redirect url: %o', redirect );

	// Open the authorize URL in a new window
	const authWindow = window.open(
		redirect.toString(),
		'WPOAuthWindow',
		'width=800,height=600'
	);

	// Listen for postMessage events
	window.addEventListener( 'message', function ( event ) {
		console.log( 'Received postMessage:', event.data );
		// You might want to handle the received data here
	} );

	// Check if the window has been closed
	const checkWindowClosed = setInterval( () => {
		if ( authWindow.closed ) {
			console.log( 'Auth window has been closed' );
			clearInterval( checkWindowClosed );
		}
	}, 500 );
};

/**
 * Clean and request a new token
 */

wpOAuth.reset = function () {
	wpOAuth.clean();
	wpOAuth.request();
};

/**
 * Return authentication object
 *
 */

wpOAuth.token = function () {
	return wpOAuth.getLocalStorageValue( OAUTH_TOKEN_KEY )
		? JSON.parse( wpOAuth.getLocalStorageValue( OAUTH_TOKEN_KEY ) )
		: null;
};
