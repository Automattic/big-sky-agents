# Big Sky Agents 🤖

## Overview

Big Sky Agents is a front-end library for building AI-enhanced applications. It is designed to work with Gutenberg UI components and WordPress.com APIs and authentication. It exists to provide a consistent AI UX across Automattic's products and to distribute innovations across projects and platforms.

Links:
 * [Package Homepage](https://github.com/Automattic/big-sky-agents/pkgs/npm/big-sky-agents)
 * [Complete React Example](https://github.com/Automattic/big-sky-agents-react) - an example of using this library in a standalone React app

## Getting Started

To use this package in your project, you can install it via npm:

```bash
npm install
```

To view the components live, you can run Storybook.

## Storybook

You can interact with the components in Storybook. For convenience, you can set the API key in .env like this. It is important to include the `STORYBOOK_` prefix for the variable to be picked up:


```bash
STORYBOOK_OPENAI_API_KEY="sk-..."
```

Then run Storybook:

```bash
npm run storybook
```

## Developing against this package locally

These instructions show you how to incorporate this package into another project for development, for example a WordPress plugin or React app.

Note that Electron doesn't currently work in this mode due to strangeness with node gyp linking.

First, make sure you're using the same Node version for both apps, e.g.

```bash
% nvm current
v20.14.0
```

Now let's link in this package.

In this directory:

```bash
npm link
```

In the other project:

```bash
npm link @automattic/big-sky-agents
```

## Publishing the package

> [!NOTE] This section applies only to members of the Automattic Github organization.

You will need to be authenticated to NPM.

```bash
npm login --scope=@automattic --registry=https://registry.npmjs.org/
```

Enter your npmjs.com credentials when prompted.

Now you should be able to publish the package. Don't forget to bump the version in `package.json` first!

```bash
npm publish --access public
```

You can [view the updated package here](https://github.com/Automattic/big-sky-agents/pkgs/npm/big-sky-agents) to verify.

## Running evaluations using LangSmith

Sign up and get an API key from https://smith.langchain.com/

You'll also need an OpenAI API key for generating responses and running some evaluations.

Add the following to your `.env` file:

```bash
OPENAI_API_KEY="sk-..."
LANGCHAIN_TRACING_V2=true
LANGCHAIN_ENDPOINT="https://api.smith.langchain.com"
LANGCHAIN_API_KEY="your-api-key"
LANGCHAIN_PROJECT="your-project"
```

Then run:

```bash
node bin/eval-wapuu.js data/site-examples.json
node bin/eval-wapuu.js data/name-examples.json

# OR

node bin/eval-weather-bot.js data/tool-examples.json
```

Right now it runs a trivial example, which you can find in [name-example.json](./eval/name-example.json).

## LocalAI

Using LocalAI, you can run the Chat Completion inference locally on your machine. This is useful for debugging, experimentation, testing, and just privacy in general.

Make sure your .env has an entry for `HUGGINGFACEHUB_API_TOKEN`.

I've only tried this on a Mac. Kinda works, might need a better model, but they're only going to improve. This is the worst they'll ever be ;)

1. Install deps: `brew install abseil grpc llama.cpp`

1. Update your .env with the correct address and settings:

```bash
LOCALAI_ADDRESS=127.0.0.1:1234
LOCALAI_CONTEXT_SIZE=8192
LOCALAI_CORS=true
```

3. Download local-ai binary:

```bash
curl -Lo local-ai "https://github.com/mudler/LocalAI/releases/download/v2.16.0/local-ai-$(uname -s)-$(uname -m)" && chmod +x local-ai
```

4. Run the binary:

If you have the .env vars, just run:

```bash
./local-ai
```

This will download the models, `hermes-2-pro-mistral` and `mistral-0.3`.

Alternatively, without the `.env` vars:

```bash
 ./local-ai --address=":1234" --cors --context-size=8192
```

## Features

The Big Sky Agent Framework is a set of core libraries and UI adapters to Gutenberg components which enables simple, pluggable, isolated agents and tools that can collaborate on shared data structures and tasks with the user. It's similar in some ways to LangChainJS/LangGraph but has no dependencies other than WordPress' core libraries (@wordpress/components, etc). It is intended to be accessible to developers at all levels of experience - but we're not there yet.

The Big Sky Agent Framework currently has the following features:

-   Goals. At the top level, there is a current Goal (and, in the future, a current Plan). This, along with the prompt, data and tools, gives the Agent a clear idea of what to do next.
-   Chat: The Chat object exposes message history and functions to add tool calls, various kinds of messages, and invoke a Chat Completion.
-   Agents. Agents expose tools and prompt templates, as well as lifecycle callbacks like "onStart" and "onConfirm".
    -   Wapuu: Here to understand your goal and choose the best agent to help you.
    -   Site Settings and Pages Assistant: Set site title, description, type, topic, location, and pages.
    -   Page Content Assistant: Add and edit pages, set page title, description, category, and sections.
    -   Design Assistant: Helps you design your site, set fonts and colors, etc. Can also analyze any URL to extract style and layout information.
    -   WordPress Tutor: Helps you learn about WordPress, joining the community, and more.
    -   Site Stats Assistant: Helps you understand your site's traffic and SEO.
    -   WooCommerce Store Assistant: Helps you manage your online store
-   Toolkits. A toolkit exposes tools, callbacks and state.
    -   Agent Toolkit
        -   Values: goal, agent, thought, etc.
        -   Tools: setGoal, setAgent, setThought, etc.
    -   Site Toolkit
        -   Values: title, description, pages, page sections, fonts, styles, content, etc
        -   Tools: setSiteTitle, setSiteDescription, etc.
    -   URL Analyzer Toolkit
        -   Values:  which can extract colors, fonts, layouts, images, business type, metadata and content from any web page.
-   Chat Models. Integrates with a wide range of proprietary and open-weights conversational LLMs, including:
    -   OpenAI 4o (with multimodal support)
    -   Our own self-hosted Llama3 70b
    -   [Groq](https://href.li/?https://groq.com/) (LLama 70b)
    -   [LocalAI](https://href.li/?https://github.com/mudler/LocalAI)
    -   LMStudio
-   Prompt Templating. We support two very lightweight templating languages: f-string and an optimized rewrite of DoT.js. Could be extended to others. Prompt templating allows for very flexible composition and rendering of content into Markdown or other formats. This also allows us to evaluate templates more easily (as if they're models).
-   Zero-dependency. Most core Agent classes can be used outside the browser and WordPress, though UI components use `@wordpress/components`.
-   Core WP Integrations. We have default integrations with WordPress Core Components and Data. Works in React Standalone, Redux, and Node.js (CLI) modes (latter coming soon).
-   Pluggable. Pluggable by any WP plugin -- add your own agent, tools, or toolkit, wrapping your own core functionalit, from eCommerce to Advertising and SEO. 
-   Multimodal. Natively multi-modal. Chat using text and images, and soon audio and video.

## Roadmap

The roadmap is roughly the following (in no particular order):

-   Needs work to get CLI working again.
-   MLFlow and/or LangSmith integration for prompt monitoring and evaluation.
-   Gutenberg integrations?
-   Lots of documentation and examples needed.
-   Add "back-end" agents which have a model limited set of tools but can operate in the background, e.g. via wp-cron, as distinguished from front-end agents which can manipulate blocks etc.
-   Add more formal hooks/filters and other integration points
-   Add "Plans", which have multiple steps potentially driven by separate agents.