/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalInputControl as InputControl,
	RangeControl,
	SelectControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { ChatModelService, ChatModelType } from '../ai/chat-model.js';
import useChat from './chat-provider/use-chat.js';

const ChatModelControls = ( { onApiKeyChanged } ) => {
	const {
		model,
		service,
		temperature,
		apiKey,
		setService,
		setModel,
		setTemperature,
		setApiKey,
	} = useChat();
	return (
		<>
			<HStack>
				<SelectControl
					label="Service"
					value={ service }
					options={ ChatModelService.getAvailable().map(
						( serviceSlug ) => {
							return {
								label: serviceSlug,
								value: serviceSlug,
							};
						}
					) }
					onChange={ ( newService ) => {
						// if the current model isn't in the list of models for the service, reset to the default for the service
						if (
							! ChatModelType.getAvailable( newService ).includes(
								model
							)
						) {
							setService( newService );
							setModel( ChatModelType.getDefault( newService ) );
						} else {
							setService( newService );
						}
					} }
				/>
				<SelectControl
					label="Model"
					value={ model ?? ChatModelType.getDefault( service ) }
					options={ ChatModelType.getAvailable( service ).map(
						( modelSlug ) => {
							return {
								label: modelSlug,
								value: modelSlug,
							};
						}
					) }
					onChange={ setModel }
				/>
				<RangeControl
					value={ temperature }
					initialPosition={ temperature }
					label="Temperature"
					max={ 1 }
					min={ 0 }
					step={ 0.1 }
					style={ { minWidth: '150px' } }
					withInputField={ false }
					onChange={ setTemperature }
				/>
			</HStack>
			<InputControl
				label="API Key"
				placeholder="sk-..."
				value={ apiKey }
				onChange={ ( newApiKey ) => {
					setApiKey( newApiKey );
					if ( typeof onApiKeyChanged === 'function' ) {
						onApiKeyChanged( newApiKey );
					}
				} }
			/>
		</>
	);
};

export default ChatModelControls;
