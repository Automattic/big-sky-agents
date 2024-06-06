export type { default as LLM, LLMModel, LLMService } from './agents/llm.d.ts';

export declare function useAgentExecutor( options: {
	agent: Agent;
	chat: Chat;
	toolkit: AgentToolkit;
} ): void;

export declare function useLLM( options: {
	token: string | undefined;
	service: string;
} ): any;
export declare function useSimpleChat( options: ChatOptions ): Chat;
export declare function useSimpleToolkit(): AgentToolkit;
export declare function useSimpleAgentToolkit( options: {
	agents: AgentConfig[];
} ): AgentToolkit;
export declare function useReduxChat( options: ChatOptions ): Chat;
export declare function useReduxToolkit(): AgentToolkit;
export declare function useReduxAgentToolkit( options: {
	agents: AgentConfig[];
} ): AgentToolkit;

interface ChatOptions {
	llm: any;
	model: string;
	temperature: number;
}

interface Message {
	role: 'assistant' | 'tool' | 'user';
	content: string | MessageContentPart[];
	tool_calls?: ToolCall[];
}

interface MessageContentPart {
	type: 'text' | 'image_url';
	text?: string;
	image_url?: string;
}

interface ToolCall {
	id: string;
	type: 'function';
	function: {
		name: string;
		arguments: any;
	};
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
	setStarted: ( started: boolean ) => void;
	error?: any;
	history: Message[];
	clearMessages: () => void;
	userSay: ( content: string, image_urls?: string[] ) => void;
	agentMessage?: string | MessageContentPart[];
	call: ( name: string, args: any, id?: string ) => void;
	setToolCallResult: ( toolCallId: string, result: any ) => void;
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
export interface Formatter {
	format( values: any ): string;
}

export interface StringPromptTemplate extends Formatter {
	constructor( options: {
		inputVariables: string[];
		template: string;
		engine: any;
		formatters?: any;
	} );
	validate( engine: any, inputVariables: string[] ): void;
}

export interface FStringPromptTemplate extends StringPromptTemplate {
	constructor( options: {
		template: string;
	} );
}

export interface DotPromptTemplate extends StringPromptTemplate {
	constructor( options: {
		template: string;
		inputVariables: string[];
	} );
}

/**
 * Agent
 */
interface Agent {
	getId(): string;
	call( toolName: string, args: any ): string;
	userSay( message: string, file_urls?: string[] ): void;
	getTools( values: any ): any[];
	findTools( ...toolNames: string[] ): any[];
	getSystemPrompt(): Formatter;
	getNextStepPrompt(): Formatter;
	onStart(): void;
}

export interface StandardAgent extends Agent {
	askUser( options: { question: string, choices: string[] } ): void;
	informUser( message: string ): void;
	setGoal( goal: any ): void;
}

/**
 * Agent Toolkit
 */
interface ToolkitCallbacks {
	[ toolName: string ]: ( args: any ) => string;
}

interface AgentToolkit {
	onReset: () => void;
	tools: any[]; // TODO: Tool
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
