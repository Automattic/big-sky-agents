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
export { default as useAgentToolkit } from './hooks/use-agent-toolkit.js';
export { slice as agentStoreSlice } from './store/agents.js';
export { slice as chatStoreSlice } from './store/chat.js';
export { slice as toolkitStoreSlice } from './store/toolkits.js';

/**
 * Components
 */
export { default as AgentUI } from './components/agent-ui.jsx';
export { default as AgentControls } from './components/agent-controls.jsx';
export { default as ChatModelControls } from './components/chat-model-controls.jsx';
export { default as PopUpControls } from './components/popup-controls.jsx';
export { default as AgentsDemoPage } from './components/agents-demo-page.jsx';
export { AgentsProvider, useAgents } from './components/agents-provider';
export { ChatProvider } from './components/chat-provider';
export { ToolkitsProvider } from './components/toolkits-provider';
export { default as ChatHistory } from './components/chat-history.jsx';

/**
 * Hooks
 */
export { default as useChatIcon } from './hooks/use-chat-icon.js';
export { default as useAgentExecutor } from './hooks/use-agent-executor.js';
export { default as useChatSettings } from './hooks/use-chat-settings.js';
export { default as useSiteToolkit } from './hooks/use-site-toolkit.js';

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
