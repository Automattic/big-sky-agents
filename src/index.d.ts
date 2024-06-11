export type {
  default as ChatModel,
  ChatModelType,
  ChatModelService,
} from "./agents/chat-model";
import { ChatModelType, ChatModelService } from "./agents/chat-model";

/**
 * Hooks
 */

export declare function useAgentExecutor(options: {
  agent: Agent;
  chat: Chat;
  toolkit: AgentToolkit;
}): void;

export declare function useChatModel(options: {
  token: string | undefined;
  service: string;
}): any;
export declare function useSimpleChat(options: ChatOptions): Chat;
export declare function useSimpleToolkit(): AgentToolkit;
export declare function useSimpleAgentToolkit(options: {
  agents: AgentConfig[];
}): AgentToolkit;
export declare function useReduxChat(options: ChatOptions): Chat;
export declare function useReduxToolkit(): AgentToolkit;
export declare function useReduxAgentToolkit(options: {
  agents: AgentConfig[];
}): AgentToolkit;

/**
 * Chat
 */

interface ChatOptions {
  token: string | undefined;
  service: ChatModelService;
  model: ChatModelType;
  temperature?: number;
  feature?: string;
}

export interface Message {
  role: "assistant" | "tool" | "user";
  content: string | MessageContentPart[];
  tool_calls?: ToolCall[];
}

interface TextMessageContentPart {
  type: "text";
  text: string;
}

interface ImageMessageContentPart {
  type: "image_url";
  image_url: string;
}

type MessageContentPart = TextMessageContentPart | ImageMessageContentPart;

interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: any;
  };
}

export interface ToolFunction {
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
}

export interface Tool {
  function: ToolFunction;
  type: "function";
}

interface AgentConfig {
  id: string;
  name: string;
  description: string;
}

interface Chat {
  running: boolean;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  started: boolean;
  setStarted: (started: boolean) => void;
  error?: any;
  history: Message[];
  clearMessages: () => void;
  userSay: (content: string, image_urls?: string[]) => void;
  agentMessage?: string | MessageContentPart[];
  call: (name: string, args: any, id?: string) => void;
  setToolCallResult: (toolCallId: string, result: any) => void;
  pendingToolRequests: ToolCall[];
  clearPendingToolRequests: () => void;
  runAgent: (
    messages: Message[],
    tools: any,
    systemPrompt: string,
    nextStepPrompt: string
  ) => void;
  onReset: () => void;
}

/**
 * Formatter and Prompt Templates
 */

export declare class Formatter {
  format(values: any): string;
}

export type FormattingEngine = (values: any) => string;

export declare class StringPromptTemplate extends Formatter {
  constructor(options: {
    inputVariables: string[];
    template: string;
    engine: FormattingEngine;
    formatters?: any;
  });
  validate(engine: FormattingEngine, inputVariables: string[]): void;
}

export declare class FStringPromptTemplate extends StringPromptTemplate {
  constructor(options: { template: string });
  static fromString(tmpl: string, options?: any): FStringPromptTemplate;
}

export declare class DotPromptTemplate extends StringPromptTemplate {
  constructor(options: { template: string; inputVariables: string[] });
}

/**
 * Agents
 */

declare class Agent {
  constructor(chat: Chat, toolkit: AgentToolkit);
  getId(): string;
  call(toolName: string, args: any): string;
  userSay(message: string, file_urls?: string[]): void;
  getTools(values: any): any[];
  findTools(...toolNames: string[]): any[];
  getSystemPrompt(): Formatter;
  getNextStepPrompt(): Formatter;
  onStart(): void;
}

export declare class StandardAgent extends Agent {
  askUser(options: { question: string; choices: string[] }): void;
  informUser(message: string): void;
  setGoal(goal: any): void;
}

/**
 * Agent Toolkit
 */

interface ToolkitCallbacks {
  [toolName: string]: (args: any) => string;
}

interface Toolkit {
  onReset: () => void;
  tools: any[]; // TODO: Tool
  values: any;
  callbacks: ToolkitCallbacks;
}

interface AgentToolkit extends Toolkit {
  values: {
    agents: any[];
    agent: Agent;
  };
  callbacks: ToolkitCallbacks;
}

/**
 * Agent UI
 */

type AgentUIProps = {
  chat: Chat;
  agent: Agent;
  toolkit: AgentToolkit;
};

export declare function AgentUI(props: AgentUIProps): JSX.Element;
export declare function AgentControls(props: AgentUIProps): JSX.Element;

/**
 * Chat UI
 */

type ChatModelControlsProps = {
  model: string;
  service: string;
  temperature: number;
  token: string;
  onServiceChanged: (service: string) => void;
  onModelChanged: (model: string) => void;
  onTemperatureChanged: (temperature: number) => void;
  onTokenChanged: (token: string) => void;
};

export declare function ChatModelControls(
  props: ChatModelControlsProps
): JSX.Element;
