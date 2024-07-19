import { Button } from '@wordpress/components';
import { close, settings } from '@wordpress/icons';
import ChatModelControls from './chat-model-controls.jsx';
import AgentControls from './agent-controls.jsx';
import ToolCallControls from './tool-call-controls.jsx';
import { useEffect, useState } from 'react';
import './popup-controls.scss';

const PopUpControls = ( { setApiKey } ) => {
	const [ controlsVisible, setControlsVisible ] = useState( false );

	// show the debug window when CTRL-D is pressed
	useEffect( () => {
		const handleKeyDown = ( event ) => {
			if ( event.ctrlKey && event.key === 'd' ) {
				setControlsVisible( ( prevVisible ) => ! prevVisible );
			}
		};

		window.addEventListener( 'keydown', handleKeyDown );

		return () => {
			window.removeEventListener( 'keydown', handleKeyDown );
		};
	}, [] );

	return (
		<div className="big-sky__agent-debug">
			{ controlsVisible ? (
				<div className="big-sky__agent-debug-contents">
					<AgentControls />
					<ChatModelControls
						onApiKeyChanged={ ( newApiKey ) => {
							if ( typeof setApiKey === 'function' ) {
								setApiKey( newApiKey );
							}
						} }
					/>
					<ToolCallControls />
					<div style={ { textAlign: 'right' } }>
						<Button
							icon={ close }
							onClick={ () => setControlsVisible( false ) }
						/>
					</div>
				</div>
			) : (
				<Button
					icon={ settings }
					onClick={ () => setControlsVisible( true ) }
				/>
			) }
		</div>
	);
};

export default PopUpControls;
