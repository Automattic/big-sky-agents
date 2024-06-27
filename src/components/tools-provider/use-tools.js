/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useMemo } from 'react';

/**
 * Internal dependencies
 */
import { Context } from './context';
export default function useTools() {
	return useContext( Context );
}
