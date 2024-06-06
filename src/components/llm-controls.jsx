/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	RangeControl,
	SelectControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { LLMModel, LLMService } from '../agents/llm.js';

const LLMControls = ( { model, service, temperature, onChanged } ) => {
	return (
		<HStack>
			<SelectControl
				label="Service"
				value={ service }
				options={ LLMService.getAvailable().map( ( serviceSlug ) => {
					return {
						label: serviceSlug,
						value: serviceSlug,
					};
				} ) }
				onChange={ ( newService ) => {
					// if the current model isn't in the list of models for the service, reset to the default for the service
					if (
						! LLMModel.getAvailable( newService ).includes( model )
					) {
						onChanged(
							newService,
							LLMModel.getDefault( newService ),
							temperature
						);
					} else {
						onChanged( newService, model, temperature );
					}
				} }
			/>
			<SelectControl
				label="Model"
				value={ model ?? LLMModel.getDefault( service ) }
				options={ LLMModel.getAvailable( service ).map(
					( modelSlug ) => {
						return {
							label: modelSlug,
							value: modelSlug,
						};
					}
				) }
				onChange={ ( newModel ) => {
					onChanged( service, newModel, temperature );
				} }
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
				onChange={ ( newTemperature ) => {
					onChanged( service, model, newTemperature );
				} }
			/>
		</HStack>
	);
};

export default LLMControls;
