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
				<>
					<AgentControls />
					<ChatModelControls
						onApiKeyChanged={ ( newApiKey ) => {
							if ( typeof setApiKey === 'function' ) {
								setApiKey( newApiKey );
							}
						} }
					/>
					<ToolCallControls />
				</>
			) : (
				<button onClick={ () => setControlsVisible( true ) }>
					Show Debug Controls
				</button>
			) }
		</div>
	);
};

export default PopUpControls;
