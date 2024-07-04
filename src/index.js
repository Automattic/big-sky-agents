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
 * Redux agent, chat and toolkit store slices
 */
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
export { default as AskUserComponent } from './components/ask-user.jsx';
export { default as ConfirmComponent } from './components/confirm.jsx';
export { default as MessageContent } from './components/message-content.jsx';
export { default as UserMessageInput } from './components/user-message-input.jsx';

/**
 * Hooks
 */
export { default as useChat } from './components/chat-provider/use-chat.js';
export { default as useAgentToolkit } from './hooks/use-agent-toolkit.js';
export { default as useChatIcon } from './hooks/use-chat-icon.js';
export { default as useAgentExecutor } from './hooks/use-agent-executor.js';
export { default as useChatSettings } from './hooks/use-chat-settings.js';
export { default as useSiteToolkit } from './hooks/use-site-toolkit.js';
export { default as useToolkits } from './components/toolkits-provider/use-toolkits.js';

/**
 * Core Classes
 */
export { default as Agent } from './ai/agents/agent.js';
export { default as BuilderAgent } from './ai/agents/builder-agent.js';

/**
 * Tools
 */
export { default as AskUserTool } from './ai/tools/ask-user.js';
export { default as ConfirmTool } from './ai/tools/confirm.js';
export { default as InformTool } from './ai/tools/inform-user.js';
export { default as createSetAgentTool } from './ai/tools/set-agent.js';
export { default as SetGoalTool } from './ai/tools/set-goal.js';
export { default as AnalyzeUrlTool } from './ai/tools/analyze-url.js';
export { createSimpleTool } from './ai/tools/tool.js';

/**
 * Prompt Templates
 */
export {
	Formatter,
	StringPromptTemplate,
	DotPromptTemplate,
	FStringPromptTemplate,
} from './ai/prompt-template.js';
