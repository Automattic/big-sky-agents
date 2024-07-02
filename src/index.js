/**
 * ChatModel and hooks
 */
export {
	default as ChatModel,
	ChatModelType,
	ChatModelService,
	GroqChatModel,
	OpenAIChatModel,
	OllamaChatModel,
	LocalAIChatModel,
	WPCOMJetpackAIChatModel,
	WPCOMOpenAIChatModel,
} from './ai/chat-model.js';
export { default as useChatModel } from './hooks/use-chat-model.js';

/**
 * Redux chat, toolkit, and agent toolkit
 */
export { default as useChat } from './components/chat-provider/use-chat.js';
export { default as useToolkit } from './hooks/use-toolkit.js';
export { default as useAgentToolkit } from './hooks/use-agent-toolkit.js';

/**
 * Components
 */
export { default as AgentUI } from './components/agent-ui.jsx';
export { default as AgentControls } from './components/agent-controls.jsx';
export { default as ChatModelControls } from './components/chat-model-controls.jsx';
export { default as AgentsDemoPage } from './components/agents-demo-page.jsx';

/**
 * Hooks
 */
export { default as useChatIcon } from './hooks/use-chat-icon.js';

/**
 * Core Classes
 */
export { default as Agent } from './ai/agents/agent.js';

/**
 * Prompt Templates
 */
export {
	Formatter,
	StringPromptTemplate,
	DotPromptTemplate,
	FStringPromptTemplate,
} from './ai/prompt-template.js';
