declare const LLMService: {
	WPCOM: 'wpcom';
	OPENAI: 'openai';
	GROQ: 'groq';
	OLLAMA: 'ollama';
	LMSTUDIO: 'lmstudio';
	LOCALAI: 'localai';
	getAvailable: () => string[];
	getDefault: () => string;
	getDefaultApiKey: (service: string) => string | null;
};

declare const LLMModel: {
	GPT_4_TURBO: 'gpt-4-turbo';
	GPT_4O: 'gpt-4o-2024-05-13';
	LLAMA3_70B_8192: 'llama3-70b-8192';
	LLAMA3_70B_8192_WPCOM: 'llama3-70b';
	GEMMA_7b_INSTRUCT: 'gemma:7b-instruct-q5_K_M';
	PHI_3_MEDIUM: 'legraphista/Phi-3-medium-128k-instruct-IMat-GGUF';
	MISTRAL_03: 'mistral-0.3';
	HERMES_2_PRO_MISTRAL: 'hermes-2-pro-mistral';
	isMultimodal: (model: string) => boolean;
	supportsToolMessages: (model: string) => boolean;
	getAvailable: (service: string) => string[];
	getDefault: (service?: string | null) => string;
};

declare class LLM {
	constructor(options: { apiKey?: string; service?: string });
	getDefaultModel(): string;
	getApiKey(): string | null;
	getService(): string;
	run(
		model: string,
		messages: any[],
		tools: any[],
		systemPrompt: string,
		agentLoopPrompt: string,
		temperature: number,
		max_tokens: number
	): Promise<any>;
	call(options: {
		model: string;
		temperature: number;
		max_tokens: number;
		messages: any[];
		tools: any[];
		tool_choice?: string | null;
	}): Promise<any>;
}
export default LLM;
export { LLMService, LLMModel };