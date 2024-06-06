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

interface Formatter {
	format( values: any ): string;
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

// interface StandardAgent extends Agent {
// 	askUser( options: { question: string; choices: any[] } ): void;
// 	informUser( message: string ): void;
// 	setGoal( goal: string ): void;
// }

// export const StandardAgent;

/**
 * LLM
 */
// const useLLM: ( options: {
// 	token: string | undefined;
// 	service: string;
// } ) => any;

/**
 * Chat
 */
// const useSimpleChat: ( options: ChatOptions ) => Chat;

// declare module './hooks/use-llm.js';
// declare module './hooks/agents/use-simple-chat.js';
// declare module './hooks/agents/use-simple-toolkit.js';
// declare module './agents/standard-agent.js';
// declare module './components/agent-ui.jsx';
// declare module './components/agents-demo-page-jetpack.jsx';

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

// const useAgentToolkit: () => AgentToolkit;

/**
 * Agent UI
 */
type AgentUIProps = {
	chat: Chat;
	agent: Agent;
	toolkit: AgentToolkit;
};
// interface AgentUIComponent extends React.FC<AgentUIProps> {}
// type AgentUIComponent = React.FC<AgentUIProps>;
// const AgentUI: ( props: AgentUIProps ) => ReactNode;
// }
