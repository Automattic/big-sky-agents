# Big Sky Agents 🤖

## Overview

This is an NPM package intended to power AI experiences across Automattic.

## Developing

These instructions show you how to incorporate this package into another project for development.

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

## Storybook

You can interact with the components in Storybook.

```bash
npm run storybook
```

## LocalAI

Using LocalAI, you can run the LLM inference locally on your machine. This is useful for debugging, experimentation, testing, and just privacy in general.

Make sure your .env has an entry for `HUGGINGFACEHUB_API_TOKEN`.

I've only tried this on a Mac. Kinda works, might need a better model, but they're only going to improve. This is the worst they'll ever be ;)

1. Update your .env with the correct address and settings. Alternatively, you can run `./local-ai --address=":1234" --cors --context-size=8192`

```bash
LOCALAI_ADDRESS=127.0.0.1:1234
LOCALAI_CONTEXT_SIZE=8192
LOCALAI_CORS=true
```

2. Install deps: `brew install abseil grpc llama.cpp`

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

The Big Sky Agent Framework is a set of core libraries and UI adapters to Gutenberg components which enables simple, pluggable, isolated agents and tools that can collaborate on shared documents and tasks with the user. It's similar in some ways to LangChainJS but has no dependencies, and it is more developer-friendly and less abstract than more general toolkits.

The Big Sky Agent Framework currently has the following features:

-   Goals. At the top level, there is always a current goal (and, in the future, a current plan). This, along with the prompt, data and tools, gives the agent a clear idea of what to do next.
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
-   LLMs. Integrates with a wide range of proprietary and open-weights LLMS, including:
    -   OpenAI 4o (with multimodal support)
    -   Our own self-hosted Llama3 70b
    -   [Groq](https://href.li/?https://groq.com/) (LLama 70b)
    -   [LocalAI](https://href.li/?https://github.com/mudler/LocalAI)
    -   LMStudio
-   Prompt Templating. We support two very lightweight templating languages: f-string and a fork of DoT.js. Could be extended to others. Prompt templating allows for very flexible composition and rendering of content into Markdown or other formats. This also allows us to evaluate templates more easily (as if they're models).
-   Zero-dependency. Most core Agent classes can be used outside the browser and WordPress.
-   Core WP Integrations. We have default integrations with WordPress Core Components and Data. Works in React Standalone, Redux, and Node.js (CLI) modes.
-   Pluggable. Pluggable by any WP plugin -- add your own agent, tools, or toolkit, wrapping your own core functionalit, from eCommerce to Advertising and SEO. 
-   Multimodal. Natively multi-modal. Chat using text and images, and soon audio and video.
-   Business Friendly. One can imagine many potential vectors for growth in subscribers and/or revenue:
    -   Hosted models and services, on a subscription or per-token basis. As the leader in the WordPress space, we naturally accrue a certain level of prestige around our solutions. We could white-label an inference service like Groq if we need to scale quickly.
    -   Smart Private History. A service similar to OpenAI Assistants which moves the inference into our back-end, behind public-api.wordpress.com, offering history storage for learning, privacy, and optimization. This means that the more you use the service, the better it understands you.
    -   Developer Tools. Offer consumers of our hosted models, services and storage integration with popular platforms like LangSmith and MLFlow for optimizing WordPress-based AI experiences. 
    -   Enabling transformative new UIs. WooCommerce in particular would benefit from AI-assisted flows to enable users to manage their stores and sites with ease. No more "one size fits all" UIs; instead, users will accomplish "goals" via "flows" that ask them only the necessary questions to get to the goal.

## Roadmap

The roadmap is roughly the following (in no particular order):

-   Needs work to get CLI working again.
-   MLFlow and/or LangSmith integration for prompt monitoring and evaluation.
-   Editor integrations (e.g. to be used with existing Big Sky front-end)
-   Lots of documentation and examples needed.
-   Add more self-hosted and WPCOM-hosted remote tools, like our Odie knowledge base for the WP Support Bot.
-   Add "back-end" agents which have a model limited set of tools but can operate in the background, e.g. via wp-cron, as distinguished from front-end agents which can manipulate blocks etc.
-   Add more formal hooks/filters and other integration points
-   Add "Plans", which have multiple steps potentially driven by separate agents. e.g. the "Build my WPCOM Site" plan might include setting up the home page, choosing a theme and building some content, but along the way the user can share files and screenshots of the kind of thing they want, guiding the experience.