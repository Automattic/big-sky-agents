/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

export const JWT_TOKEN_ID = 'jetpack-ai-jwt-token';
export const JWT_TOKEN_EXPIRATION_TIME = 2 * 60 * 1000;

declare global {
	interface Window {
		JP_CONNECTION_INITIAL_STATE: {
			apiNonce: string;
			siteSuffix: string;
			connectionStatus: { isActive: boolean };
		};
		Jetpack_Editor_Initial_State: {
			wpcomBlogId: string;
		};
		_currentSiteType: string;
	}
}

/**
 * Get the site type from environment
 *
 * @return {(string|null)} Site type
 */
function getSiteType(): string | null {
	return 'object' === typeof window &&
		typeof window._currentSiteType === 'string'
		? window._currentSiteType
		: null;
}

/**
 * Check if environment is Simple site.
 *
 * @return {boolean} True for Simple sites.
 */
function isSimpleSite(): boolean {
	return getSiteType() === 'simple';
}


/**
 * Request a token from the Jetpack site to use with the API
 *
 * This file is used to request a token from the Jetpack site to use with the API
 * This is a copy of https://github.com/Automattic/big-sky-plugin/blob/trunk/src/utils/request-jetpack-token.ts
 * Which is a copy of https://github.com/woocommerce/woocommerce/blob/trunk/packages/js/ai/src/utils/requestJetpackToken.ts
 * Which is a copy of https://github.com/Automattic/jetpack/blob/2f10669cb673eb3e73b6f0001158e8ab62e4a6bc/projects/js-packages/ai-client/src/jwt/index.ts
 *
 * WooCommerce package cannot be used, because it was never published.
 * Jetpack package is published but its throwing errors if imported anywhere except in Jetpack.
 *
 * If you are going to copy this to your project, godspeed.
 *
 * @return {Promise<{token: string, blogId: string}>} The token and the blogId
 */

export async function requestJetpackToken() {
	const token = localStorage.getItem( JWT_TOKEN_ID );
	let tokenData;

	if ( token ) {
		tokenData = JSON.parse( token );
	}

	if ( tokenData && tokenData?.expire > Date.now() ) {
		console.info( 'Using cached token' );
		return tokenData;
	}

	const apiNonce = window.JP_CONNECTION_INITIAL_STATE?.apiNonce;
	const siteId = window.Jetpack_Editor_Initial_State?.wpcomBlogId;

	let data = {
		token: '',
		blog_id: '',
	};

	if ( ! isSimpleSite() ) {
		data = await apiFetch( {
			path: '/jetpack/v4/jetpack-ai-jwt?_cacheBuster=' + Date.now(),
			credentials: 'same-origin',
			headers: {
				'X-WP-Nonce': apiNonce,
			},
			method: 'POST',
		} );
	} else {
		data = await apiFetch( {
			path: '/wpcom/v2/sites/' + siteId + '/jetpack-openai-query/jwt',
			method: 'POST',
		} );
	}

	const newTokenData = {
		token: data.token,
		blogId: data.blog_id,

		/**
		 * Let's expire the token in 2 minutes
		 */
		expire: Date.now() + JWT_TOKEN_EXPIRATION_TIME,
	};

	console.info( 'Storing new token' );
	localStorage.setItem( JWT_TOKEN_ID, JSON.stringify( newTokenData ) );

	return newTokenData;
}
