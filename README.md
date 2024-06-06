# Big Sky Agents

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
