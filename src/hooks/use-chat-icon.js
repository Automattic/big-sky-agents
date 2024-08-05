/**
 * External dependencies
 */
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import { useCallback, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import aiImage from './ai.riv';

const useChatIcon = () => {
	const stateMachineName = 'State Machine 1';
	const { rive, RiveComponent } = useRive( {
		src: aiImage,
		stateMachines: stateMachineName,
		autoplay: false,
	} );

	const generateInput = useStateMachineInput(
		rive,
		stateMachineName,
		'Generate'
	);
	const doneInput = useStateMachineInput( rive, stateMachineName, 'Done' );

	const startStateMachine = useCallback( () => {
		if ( rive && rive.artboard ) {
			rive.play( stateMachineName );
		}
	}, [ rive, stateMachineName ] );

	useEffect( () => {
		return () => {
			if ( rive ) {
				rive.cleanup();
			}
		};
	}, [ rive ] );

	useEffect( () => {
		startStateMachine();
	}, [ startStateMachine ] );

	const pauseStateMachine = useCallback( () => {
		if ( rive && rive.artboard ) {
			rive.pause( stateMachineName );
		}
	}, [ rive, stateMachineName ] );

	const playGenerate = useCallback( () => {
		startStateMachine();
		if ( generateInput ) {
			generateInput.fire();
		}
	}, [ generateInput, startStateMachine ] );

	const playDone = useCallback( () => {
		if ( doneInput ) {
			doneInput.fire();
		}
	}, [ doneInput ] );

	return {
		rive,
		RiveComponent,
		playDone,
		playGenerate,
		startStateMachine,
		pauseStateMachine,
	};
};

export default useChatIcon;
