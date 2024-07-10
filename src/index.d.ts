export type {
	default as ChatModel,
	ChatModelType,
	ChatModelService,
	GroqChatModel,
	OpenAIChatModel,
	OllamaChatModel,
	LocalAIChatModel,
	WPCOMJetpackAIChatModel,
	WPCOMOpenAIChatModel,
} from './ai/chat-model';

import { ChatModelType, ChatModelService } from './ai/chat-model';

export declare function useChatModel( options: {
	apiKey: string | undefined;
	service: string;
	feature?: string;
	sessionId?: string;
} ): any;

interface ChatIconHook {
	rive: any;
	RiveComponent: any;
	playDone: () => void;
	playGenerate: () => void;
	startStateMachine: () => void;
	pauseStateMachine: () => void;
}

export declare function useChatIcon(): ChatIconHook;
export declare function useChat( options: ChatOptions ): Chat;
export declare function useToolkit(): AgentToolkit;
export declare function useAgentToolkit( options: {
	agents: AgentConfig[];
} ): AgentToolkit;

export declare function AskUserComponent(): any;
export declare function ConfirmComponent(): any;
export declare function MessageContent( props: {
	content: MessageContentParts;
} ): JSX.Element;
export declare function withToolCall(
	toolCallName: string,
	Component: any
): any;

/**
 * Chat
 */

interface ChatOptions {
	apiKey: string | undefined;
	service: ChatModelService;
	model: ChatModelType;
	temperature?: number;
	feature?: string;
}

// define MessageRole enum
enum MessageRole {
	ASSISTANT = 'assistant',
	USER = 'user',
	TOOL = 'tool',
}

interface BaseMessage {
	role: MessageRole;
	content: MessageContentParts;
}

interface AssistantMessage extends BaseMessage {
	role: MessageRole.ASSISTANT;
	tool_calls?: ToolCall[];
}

interface UserMessage extends BaseMessage {
	role: MessageRole.USER;
}

interface ToolMessage extends BaseMessage {
	role: MessageRole.TOOL;
	tool_call_id: string;
}

export type Message = AssistantMessage | UserMessage | ToolMessage;

interface TextMessageContentPart {
	type: 'text';
	text: string;
}

interface ImageMessageContentPart {
	type: 'image_url';
	image_url: string;
}

type MessageContentPart = TextMessageContentPart | ImageMessageContentPart;
type MessageContentParts = string | MessageContentPart[];

interface ToolCall {
	id: string;
	type: 'function';
	function: {
		name: string;
		arguments: any;
	};
}

export interface ToolFunction {
	name: string;
	description?: string;
	parameters?: Record< string, unknown >;
}

export interface Tool {
	function: ToolFunction;
	type: 'function';
}

interface AgentConfig {
	id: string;
	name: string;
	description: string;
}

interface Chat {
	running: boolean;
	enabled: boolean;
	setEnabled: ( enabled: boolean ) => void;
	started: boolean;
	error?: any;
	messages: Message[];
	clearMessages: () => void;
	userSay: ( content: string, image_urls?: string[] ) => void;
	assistantMessage?: MessageContentParts;
	call: ( name: string, args: any, id?: string ) => void;
	setToolResult: ( toolCallId: string, result: any ) => void;
	pendingToolCalls: ToolCall[];
	runChat: (
		messages: Message[],
		tools: any,
		instructions: string,
		additionalInstructions: string
	) => void;
	reset: () => void;
}

/**
 * Formatter and Prompt Templates
 */

export declare class Formatter {
	format( values: any ): string;
}

export type FormattingEngine = ( values: any ) => string;

export declare class StringPromptTemplate extends Formatter {
	constructor( options: {
		inputVariables: string[];
		template: string;
		engine: FormattingEngine;
		formatters?: any;
	} );
	validate( engine: FormattingEngine, inputVariables: string[] ): void;
}

export declare class FStringPromptTemplate extends StringPromptTemplate {
	constructor( options: { template: string } );
	static fromString( tmpl: string, options?: any ): FStringPromptTemplate;
}

export declare class DotPromptTemplate extends StringPromptTemplate {
	constructor( options: { template: string; inputVariables: string[] } );
	static fromString(
		tmpl: string,
		templateVariables?: Array,
		options?: any
	): FStringPromptTemplate;
}

/**
 * Agents
 */

declare class Agent {
	constructor();
	get id(): string;
	get description(): string;
	get assistantId(): string;
	tools( context: any ): Tool[];
	instructions( context: any ): string;
	additionalInstructions( context: any ): string;
	onStart( chat: any, context: any ): void;
}

interface AgentState {
	tools: Tool[];
	instructions: string;
	additionalInstructions: string;
	onStart: () => void;
	onConfirm?: ( args: any ) => string;
}

export declare class StandardAgent extends Agent {
	askUser( options: { question: string; choices: string[] } ): void;
	informUser( message: string ): void;
	setGoal( goal: any ): void;
}

/**
 * Agent Toolkit
 */

interface ToolkitCallbacks {
	[ toolName: string ]: ( args: any ) => string;
}

interface Toolkit {
	reset: () => void;
	tools: Tool[]; // TODO: Tool
	context: any;
	callbacks: ToolkitCallbacks;
}

interface AgentToolkit extends Toolkit {
	context: {
		agents: any[]; // TODO: define this agent config
		agent: {
			assistantId: string;
			id: string;
			name: string;
			goal: string;
			thought: string;
		};
	};
	callbacks: ToolkitCallbacks;
}

/**
 * Agent UI
 */

type AgentUIProps = {
	chat: Chat;
	agent: AgentState;
	toolkit: AgentToolkit;
};

export declare function AgentUI( props: AgentUIProps ): JSX.Element;

/**
 * Chat UI
 */
export declare function AgentControls( props: AgentUIProps ): JSX.Element;
export declare function ChatModelControls( props: {
	onApiKeyChanged: ( apiKey: string ) => void;
} ): JSX.Element;

export declare function ToolCallControls(): JSX.Element;
