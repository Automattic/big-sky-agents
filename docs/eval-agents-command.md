# `eval-agents` Command Documentation

## Overview

The `eval-agents` command is a Node.js script that evaluates one or more AI agents against a specified dataset. It uses various AI models and services to perform the evaluation and generates a detailed report of the results.

## Prerequisites

- Node.js (version 14 or later for ESM support)
- Required npm packages: `yargs`, `dotenv`, `open` (install using `npm install yargs dotenv open`)

## Usage

```bash
node src/eval-agents.js [options]
```

Or, in the consumer package:

```bash
node_modules/.bin/eval-agents [options]
```

## Options

| Option | Alias | Type | Description | Default |
|--------|-------|------|-------------|---------|
| --name | -n | string | Name of the evaluation | "Evaluation" |
| --dataset | -d | string | Path to the dataset file | (Required) |
| --apiKey | -k | string | API key for the service | process.env.OPENAI_API_KEY |
| --temperature | -t | number | Temperature for the model | 0.1 |
| --maxTokens | -m | number | Maximum tokens for the model | 2000 |
| --model | -o | string | Model type to use | GPT_4O_MINI |
| --service | -s | string | Service to use | OPENAI |
| --agent | -a | array | Paths to agent JavaScript files | (Required) |
| --json | -j | boolean | Output in JSON format | false |
| --help | -h | | Show help | |

## Environment Variables

The script uses `dotenv` to load environment variables. You can set the following variable in a `.env` file:

- `OPENAI_API_KEY`: Your OpenAI API key (used as default if --apiKey is not provided)

## Input

### Dataset File

The `--dataset` option should point to a JSON file containing the evaluation dataset. The structure of this file should match the expected input format for the `loadDataset` function.

### Agent Files

The `--agent` option accepts one or more paths to JavaScript files that export agent objects. These files should have a default export that represents the agent to be evaluated.

## Output

By default, the script generates an HTML report (`eval.html`) and opens it in the default web browser. It also opens the URL specified in the `reportUrl` field of the evaluation results.

If the `--json` flag is used, the script outputs the raw JSON results to the console instead of generating an HTML report.

## Evaluation Process

1. The script loads the specified dataset and agent(s).
2. It runs the evaluation using the `runEvaluation` function, which is imported from `./eval.js`.
3. The evaluation is performed using the specified model, service, and parameters.
4. Results are collected for each agent and example in the dataset.

## HTML Report

The generated HTML report includes:

- Overall evaluation results for each agent
- Tables showing individual example results
- Summary results for each agent
- Comparative results between agents
- Links to detailed reports

## Examples

1. Evaluate a single agent using default settings:
   ```
   ./eval-agents.js -d path/to/dataset.json -a path/to/agent.js
   ```

2. Evaluate multiple agents with custom settings:
   ```
   ./eval-agents.js -n "Custom Evaluation" -d path/to/dataset.json -a agent1.js agent2.js -t 0.5 -m 1000 -o GPT_4 -s ANTHROPIC -k your-api-key
   ```

3. Output results in JSON format:
   ```
   ./eval-agents.js -d path/to/dataset.json -a path/to/agent.js --json > results.json
   ```

## Notes

- The script uses the `ChatModelService` and `ChatModelType` enums to specify the service and model. Make sure these are properly defined in the imported `./ai/chat-model.js` file.
- The `runEvaluation` function is expected to return a result object with `evaluationResults` and `comparativeResult` properties.
- The script sorts the example results by `exampleId` when generating the HTML report.

For more information on the Big Sky Agents library and its components, refer to the project documentation or source code.