/**
 * WordPress dependencies
 */
import { createRoot } from 'react-dom';
import React from 'react';

/**
 * Internal dependencies
 */
import AgentsDemoPageStandalone from './components/agents-demo-page-standalone.jsx';

window.addEventListener( 'load', () => {
	createRoot(document.getElementById('big-sky-agents-demo')).render(
		React.createElement(AgentsDemoPageStandalone, null)
	);
} );
