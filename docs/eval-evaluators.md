# Big Sky Evaluators Documentation

## Overview

Big Sky uses a flexible evaluation system to assess the performance of AI agents. This document describes the three types of evaluators, how they are registered and invoked, and details the specific evaluators currently implemented.

## Types of Evaluators

1. **Standard Evaluators**: These evaluate individual runs against example outputs.
2. **Comparative Evaluators**: These compare multiple runs against each other.
3. **Summary Evaluators**: These provide an overall assessment of multiple runs.

## Registering Evaluators

Evaluators are registered using the `Evaluators` object with the following methods:

```javascript
// Standard Evaluators
Evaluators.register(name, evaluatorFunction);

// Comparative Evaluators
Evaluators.registerComparative(name, evaluatorFunction);

// Summary Evaluators
Evaluators.registerSummary(name, evaluatorFunction);
```

## Implemented Evaluators

### Standard Evaluators

1. **matchToolCall** (`chat:matchToolCall`)
   - Checks if the expected tool call matches the actual tool call in the output.

2. **compareContent** (`chat:compareContent`)
   - Compares the content of the example and output messages for similarity.

3. **includeContext** (`chat:includeContext`)
   - Checks if the output includes a specific context variable.

4. **includeString** (`chat:includeString`)
   - Checks if the output includes a specific string.

5. **matchRegex** (`chat:matchRegex`)
   - Checks if the output matches a given regular expression.

### Comparative Evaluators

1. **evaluatePairwise** (`chat:evaluatePairwise`)
   - Compares the first two runs using LLM preference evaluation.

### Summary Evaluators

1. **customSummaryEvaluator** (`chat:customSummaryEvaluator`)
   - A placeholder summary evaluator for demonstration purposes.

## Using Evaluators in Datasets

Evaluators are specified in the dataset JSON under three keys:

1. `evaluators`: For standard evaluators
2. `comparativeEvaluators`: For comparative evaluators
3. `summaryEvaluators`: For summary evaluators

Example:

```json
{
  "evaluators": [
    {
      "key": "match_tool_call",
      "description": "If a tool call is expected, does it match?",
      "function": "chat:matchToolCall"
    },
    {
      "key": "match_message_content",
      "description": "If a message content is expected, does it match?",
      "function": "chat:compareContent"
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

## Evaluator Function Signatures

### Standard Evaluators

```javascript
(key) => async (run, example) => {
  // Evaluation logic
  return {
    key,
    score: // boolean or number
  };
}
```

### Comparative Evaluators

```javascript
(key) => async (runs, example) => {
  // Comparison logic
  return {
    key,
    scores: {
      [runId]: score, // for each run
    }
  };
}
```

### Summary Evaluators

```javascript
(key) => async (runs, examples) => {
  // Summary logic
  return {
    key,
    score: // number
    comment: // string
  };
}
```

## Notes

- The `IGNORE` constant can be used in example outputs to ignore specific fields during comparison.
- Some evaluators (e.g., `includeContext`, `includeString`, `matchRegex`) require additional configuration when registered in the dataset.
- The `evaluatePairwise` function uses an LLM to compare the first two runs, providing a more nuanced evaluation.

For more detailed information on each evaluator's implementation, refer to the `src/evaluators/chat.js` file in the project repository.