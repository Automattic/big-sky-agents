# Big Sky Agents LangGraph Cloud Example

This is an example agent to deploy with LangGraph Cloud. It is based on https://github.com/langchain-ai/langgraph-example.

To run it locally, install [LangGraph Studio](https://github.com/langchain-ai/langgraph-studio), then drag this folder into the LangGraph Studio window.

You will also need to create a `.env` file with the following:

```
LANGGRAPH_CLOUD_API_KEY=
ANTHROPIC_API_KEY=...
TAVILY_API_KEY=...
OPENAI_API_KEY=...
LANGCHAIN_TRACING_V2=true
LANGCHAIN_ENDPOINT="https://api.smith.langchain.com"
LANGCHAIN_API_KEY=...
LANGCHAIN_PROJECT=...
```

[LangGraph](https://github.com/langchain-ai/langgraph) is a library for building stateful, multi-actor applications with LLMs. The main use cases for LangGraph are conversational agents, and long-running, multi-step LLM applications or any LLM application that would benefit from built-in support for persistent checkpoints, cycles and human-in-the-loop interactions (ie. LLM and human collaboration).

To deploy on LangGraph Cloud, follow the instructions [here](https://langchain-ai.github.io/langgraph/cloud/).
