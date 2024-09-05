# Big Sky Agents Eval Dataset Documentation

## Overview

This document describes the JSON format used for the `eval-agents` command input dataset in the Big Sky Agents library.

Example:

```bash
node src/eval-agents.js --name test --agent ./src/ai/agents/weather-agent/v1.js --agent ./src/ai/agents/weather-agent/v2.js --dataset data/tool-examples.json
```

This dataset format includes input/output examples and evaluation functions, all specified in JSON.

For more information on evaluator functions, see the [Big Sky Evaluators documentation](./eval-evaluators.md).

## JSON Structure

The main JSON object contains the following top-level keys:

- `name`: String
- `description`: String
- `data`: Array of objects
- `evaluators`: Array of objects
- `comparativeEvaluators`: Array of objects
- `summaryEvaluators`: Array of objects

### Evaluators

- evaluators operate per example
- summaryEvaluators operate per experiment
- comparativeEvaluators operate across experiments, to compare models

### Root Object

```json
{
  "name": "String",
  "description": "String",
  "data": [...],
  "evaluators": [...],
  "comparativeEvaluators": [...],
  "summaryEvaluators": [...]
}
```

### Data Object

The `data` array contains objects representing individual test cases. Each object has the following structure:

```json
{
  "id": "String",
  "description": "String",
  "inputs": {
    "context": {...},
    "messages": [...]
  },
  "outputs": {
    "message": {...}
  }
}
```

#### Inputs

The `inputs` object contains:

- `context`: An object representing the current context. This is composed of merged contexts from "toolkits" associated with a given agent. It can include placeholders for names, site titles, etc., which the agent can use when formatting its available tools or prompt.
- `messages`: An array of message objects representing the conversation history.

#### Outputs

The `outputs` object contains a `message` object representing the expected output. This can include:

- `role`: String (e.g., "assistant")
- `content`: String
- `tool_calls`: Array of tool call objects (optional)

### Tool Calls

The `tool_calls` structure follows the OpenAI chat completions format:

```json
{
  "type": "function",
  "function": {
    "name": "String",
    "arguments": {...}
  }
}
```

### Evaluators

The `evaluators`, `comparativeEvaluators`, and `summaryEvaluators` arrays contain objects with the following structure:

```json
{
  "key": "String",
  "description": "String",
  "function": "String"
}
```

The `function` field should reference a predefined function in the Big Sky Agents library. For example, `"chat:matchToolCall"` or `"chat:compareContent"`.

## Usage Notes

1. There are no strict limits on the number of examples, evaluators, or other elements in the JSON structure. However, be mindful of available RAM and the cost of running evaluations.

2. The `tool_calls` and message structure should be identical to the OpenAI chat completions format for "chat"-style datasets.

3. Future versions may include tool datasets with their own evaluations.

4. When creating datasets, ensure that the JSON is well-formed and follows the structure outlined in this document.

5. The `context` object in the inputs is a Big Sky convention and can be used to provide contextual information for the agent's responses.

## Example

Here's a simplified example of a valid dataset:

```json
{
  "name": "Get the Weather",
  "description": "Getting the weather for a location",
  "data": [
    {
      "id": "1",
      "description": "Get weather for the current location by default",
      "inputs": {
        "context": {
          "currentLocation": "Boston, MA"
        },
        "messages": [
          {
            "role": "assistant",
            "content": "How can I help you?"
          },
          {
            "role": "user",
            "content": "Get the weather"
          }
        ]
      },
      "outputs": {
        "message": {
          "role": "assistant",
          "content": "",
          "tool_calls": [
            {
              "type": "function",
              "function": {
                "name": "getWeather",
                "arguments": {
                  "location": "Boston, MA"
                }
              }
            }
          ]
        }
      }
    }
  ],
  "evaluators": [
    {
      "key": "match_tool_call",
      "description": "If a tool call is expected, does it match?",
      "function": "chat:matchToolCall"
    }
  ],
  "comparativeEvaluators": [
    {
      "key": "llm_comparison",
      "description": "Compare the first two answers with each other by LLM preference",
      "function": "chat:evaluatePairwise"
    }
  ],
  "summaryEvaluators": [
    {
      "key": "custom_summary_evaluator",
      "description": "Test summary evaluator",
      "function": "chat:customSummaryEvaluator"
    }
  ]
}
```

For more information and the latest updates, please refer to the [Big Sky Agents GitHub repository](https://github.com/Automattic/big-sky-agents).