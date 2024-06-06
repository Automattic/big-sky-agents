/**
 * WordPress dependencies
 */
import {
  __experimentalHStack as HStack,
  RangeControl,
  SelectControl,
  __experimentalInputControl as InputControl,
} from "@wordpress/components";

/**
 * Internal dependencies
 */
import { LLMModel, LLMService } from "../agents/llm.js";

const LLMControls = ({
  model,
  service,
  temperature,
  token,
  onServiceChanged,
  onModelChanged,
  onTemperatureChanged,
  onTokenChanged,
}) => {
  return (
    <>
      <HStack>
        <SelectControl
          label="Service"
          value={service}
          options={LLMService.getAvailable().map((serviceSlug) => {
            return {
              label: serviceSlug,
              value: serviceSlug,
            };
          })}
          onChange={(newService) => {
            // if the current model isn't in the list of models for the service, reset to the default for the service
            if (!LLMModel.getAvailable(newService).includes(model)) {
              onServiceChanged(newService);
              onModelChanged(LLMModel.getDefault(newService));
            } else {
              onServiceChanged(newService);
            }
          }}
        />
        <SelectControl
          label="Model"
          value={model ?? LLMModel.getDefault(service)}
          options={LLMModel.getAvailable(service).map((modelSlug) => {
            return {
              label: modelSlug,
              value: modelSlug,
            };
          })}
          onChange={onModelChanged}
        />
        <RangeControl
          value={temperature}
          initialPosition={temperature}
          label="Temperature"
          max={1}
          min={0}
          step={0.1}
          style={{ minWidth: "150px" }}
          withInputField={false}
          onChange={onTemperatureChanged}
        />
      </HStack>
      <InputControl
        label="API Token"
        placeholder="sk-..."
        value={token}
        onChange={onTokenChanged}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            handleSubmit(event);
          }
        }}
      />
    </>
  );
};

export default LLMControls;
