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
	LocalGraphChatModel,
	WPCOMGraphChatModel,
} from './ai/chat-model';

export type { AssistantModelService } from './ai/assistant-model';

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
export declare function useChat(): Chat;
export declare function useToolkit( toolkit: Toolkit ): void;
export declare function useAgentsToolkit(): void;

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

// define MessageRole enum
declare enum MessageRole {
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
		templateVariables?: string[],
		options?: any
	): FStringPromptTemplate;
}

type InvokeTools = { [ key: string ]: () => void }

/**
 * Agents
 */

export declare class Agent {
	constructor();
	get id(): string;
	get description(): string;
	get assistantId(): string;
	tools( context: any ): Tool[];
	toolkits( context: any ): Array<Toolkit | string>;
	instructions( context: any ): string;
	additionalInstructions( context: any ): string;
	onToolResult( toolName: string, value: any, invoke: InvokeTools, context: any ): void;
	onStart( invoke: InvokeTools ): void;
}

/**
 * Agent Toolkit
 */

interface ToolkitCallbacks {
	[ toolName: string ]: ( args: any ) => string;
}

interface Toolkit {
	reset: () => void;
	tools: Tool[] | (( context: any ) => Tool[]);
	context: any;
	callbacks: ToolkitCallbacks;
}

/**
 * Agent UI
 */
export declare function AgentUI(): JSX.Element;

/**
 * Chat UI
 */
export declare function AgentControls(): JSX.Element;
export declare function ChatModelControls( props: {
	onApiKeyChanged: ( apiKey: string ) => void;
} ): JSX.Element;

export declare function ToolCallControls(): JSX.Element;
