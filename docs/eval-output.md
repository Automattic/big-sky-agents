# Big Sky Agents Eval-Agents Command Output Documentation

## Overview

This document describes the JSON output format for the `eval-agents` command in the Big Sky Agents library. The output provides detailed evaluation results for one or more agents, including individual example results, summary results, and comparative results.

## JSON Structure

The main JSON object contains the following top-level keys:

- `evaluationResults`: Array of objects
- `comparativeResult`: Object
- `reportUrl`: String

### Root Object

```json
{
  "evaluationResults": [...],
  "comparativeResult": {...},
  "reportUrl": "String"
}
```

## Evaluation Results

The `evaluationResults` array contains objects representing the evaluation results for each agent. Each object has the following structure:

```json
{
  "agent": "String",
  "reportUrl": "String",
  "tags": ["String"],
  "metadata": {...},
  "results": [...],
  "summaryResults": [...]
}
```

### Fields

- `agent`: String representing the agent name. There are no specific naming conventions for this field.
- `reportUrl`: String containing the URL for the specific agent's evaluation report.
- `tags`: Array of strings representing tags associated with the agent. These are obtained from the agent and passed to LangSmith for reporting and aggregation.
- `metadata`: Object containing metadata associated with the agent. This is also obtained from the agent and passed to LangSmith. The `version` field in metadata is often used to distinguish between different versions of the same agent in cross-evaluations.
- `results`: Array of objects representing individual example results.
- `summaryResults`: Array of objects representing summary evaluation results.

### Example Results

Each object in the `results` array has the following structure:

```json
{
  "exampleId": "String",
  "results": [
    {
      "key": "String",
      "score": Boolean | Number,
      "sourceRunId": "String"
    }
  ]
}
```

- `exampleId`: String corresponding to the `id` field of the example in the input dataset.
- `key`: String representing the key for a specific evaluation (e.g., "match_tool_call", "match_message_content").
- `score`: Boolean or Number representing the actual score for the evaluation.
- `sourceRunId`: String representing a unique identifier for the specific evaluation run.

### Summary Results

The `summaryResults` array contains objects with the following structure:

```json
{
  "key": "String",
  "score": Number,
  "comment": "String"
}
```

- `key`: String representing the key for the summary evaluation.
- `score`: Number representing the score for the summary evaluation.
- `comment`: String providing additional context or explanation for the summary evaluation.

## Comparative Result

The `comparativeResult` object contains comparative evaluation results between different agents or versions. It has the following structure:

```json
{
  "experimentName": "String",
  "results": [
    {
      "key": "String",
      "scores": {
        "String": Number
      },
      "source_run_id": "String"
    }
  ]
}
```

- `experimentName`: String describing the comparison being made.
- `results`: Array of objects containing comparative evaluation results.
  - `key`: String representing the key for the comparative evaluation.
  - `scores`: Object with keys representing run IDs and values representing their respective scores.
  - `source_run_id`: String representing a unique identifier for the specific comparative evaluation run.

## Report URL

The top-level `reportUrl` field contains a string URL for a comparative report of all agents being cross-evaluated in a single run.

## Usage Notes

1. The `reportUrl` fields provide links to detailed reports for both individual agent evaluations and cross-agent comparisons.
2. Tags and metadata from each agent are passed to LangSmith for reporting and aggregation purposes.
3. The `exampleId` in the results corresponds to the `id` field of examples in the input dataset.
4. Evaluation keys (e.g., "match_tool_call", "match_message_content") represent specific types of evaluations performed on each example.
5. Scores can be boolean (true/false) or numeric, depending on the type of evaluation.
6. Summary results provide an overall evaluation of an agent's performance across all examples.
7. Comparative results allow for direct comparison between different agents or versions of the same agent.
8. Version numbers or other distinguishing metadata should be used when cross-evaluating agents to differentiate between them.

## Example

Here's a simplified example of a valid output:

```json
{
  "evaluationResults": [
    {
      "agent": "Big Sky Site Design",
      "reportUrl": "https://smith.langchain.com/o/...",
      "tags": ["site-design"],
      "metadata": {
        "version": "1.0.0"
      },
      "results": [
        {
          "exampleId": "example-1",
          "results": [
            {
              "key": "match_tool_call",
              "score": true,
              "sourceRunId": "643dcebb-35ea-4dbd-86c0-55b66fcd5a62"
            },
            {
              "key": "match_message_content",
              "score": true,
              "sourceRunId": "096602fe-1ce7-4838-bb43-5cc4bab951ec"
            }
          ]
        }
      ],
      "summaryResults": [
        {
          "key": "custom_summary_evaluator",
          "score": 1,
          "comment": "Example summary evaluator output"
        }
      ]
    }
  ],
  "comparativeResult": {
    "experimentName": "test-weather_bot-v1-2bfd382b vs. test-weather_bot-v2-43457697-e86e",
    "results": [
      {
        "key": "llm_comparison",
        "scores": {
          "ef9e7e3a-48a5-483e-ae2e-96e5608993bf": 0,
          "22b18ff3-a6b1-43e6-b18e-4eaf564f8bec": 0
        },
        "source_run_id": "a9ac60c6-4f75-4a3f-a5d0-f239b28dbb65"
      }
    ]
  },
  "reportUrl": "https://smith.langchain.com/o/..."
}
```

For more information and the latest updates, please refer to the [Big Sky Agents GitHub repository](https://github.com/Automattic/big-sky-agents).