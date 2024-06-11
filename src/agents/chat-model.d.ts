import { Message, Tool } from '..';

declare class ChatModelService {
	static readonly WPCOM_JETPACK_AI: 'wpcom-jetpack-ai';
	static readonly WPCOM_OPENAI: 'wpcom-openai'; // the wpcom OpenAI proxy
	static readonly OPENAI: 'openai';
	static readonly GROQ: 'groq';
	static readonly OLLAMA: 'ollama';
	static readonly LMSTUDIO: 'lmstudio';
	static readonly LOCALAI: 'localai';

	static getAvailable: () => string[];
	static getDefault: () => string;
	static getDefaultApiKey: ( service: string ) => string | null;
}

declare class ChatModelType {
	static readonly GPT_4_TURBO: 'gpt-4-turbo';
	static readonly GPT_4O: 'gpt-4o';
	static readonly LLAMA3_70B_8192: 'llama3-70b-8192';
	static readonly LLAMA3_70B_8192_WPCOM: 'llama3-70b';
	static readonly GEMMA_7b_INSTRUCT: 'gemma:7b-instruct-q5_K_M';
	static readonly PHI_3_MEDIUM: 'legraphista/Phi-3-medium-128k-instruct-IMat-GGUF';
	static readonly MISTRAL_03: 'mistral-0.3';
	static readonly HERMES_2_PRO_MISTRAL: 'hermes-2-pro-mistral';

	static isMultimodal: ( model: ChatModelType ) => boolean;
	static supportsToolMessages: ( model: ChatModelType ) => boolean;
	static getAvailable: ( service: ChatModelService ) => string[];
	static getDefault: ( service?: ChatModelService | null ) => string;
}

declare class ChatModel {
	constructor( options: { apiKey?: string; service?: string } );
	getDefaultModel(): ChatModelType;
	getApiKey(): string | null;
	getService(): ChatModelService;
	run( options: {
		model: ChatModelType;
		messages: Message[];
		tools?: Tool[];
		systemPrompt: string;
		agentLoopPrompt?: string;
		temperature?: number;
		maxTokens?: number;
		feature?: string;
	} ): Promise< any >;
	call( options: {
		model: ChatModelType;
		messages: Message[];
		tools: Tool[];
		temperature?: number;
		max_tokens?: number;
		tool_choice?: string | null;
		feature?: string;
	} ): Promise< any >;
}
export default ChatModel;
export { ChatModelService, ChatModelType };
