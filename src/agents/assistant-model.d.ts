import { Message, Tool } from '..';
declare class AssistantModelService {
	static readonly WPCOM_OPENAI: 'wpcom-openai'; // the wpcom OpenAI proxy
	static readonly OPENAI: 'openai';

	static getAvailable: () => string[];
	static getDefault: () => string;
	static getDefaultApiKey: ( service: string ) => string | null;
}

declare class AssistantModelType {
	static readonly GPT_4_TURBO: 'gpt-4-turbo';
	static readonly GPT_4O: 'gpt-4o';

	static isMultimodal: ( model: AssistantModelType ) => boolean;
	static supportsToolMessages: ( model: AssistantModelType ) => boolean;
	static getAvailable: ( service: AssistantModelService ) => string[];
	static getDefault: ( service?: AssistantModelService | null ) => string;
}

interface ChatCompletionRequest {
	model: AssistantModelType;
	messages: Message[];
	tools?: Tool[];
	temperature?: number;
	max_tokens?: number;
	tool_choice?: string | null;
	feature?: string;
};

declare interface RunThreadRequest {
	threadId: string;
	assistantId: string;
	model?: AssistantModelType;
	instructions?: string;
	additionalInstructions?: string;
	additionalMessages?: string[];
	tools?: string[];
	metadata?: object;
	temperature?: number;
	maxPromptTokens?: number;
	maxCompletionTokens?: number;
	truncationStrategy?: string;
	responseFormat?: object;
}

declare interface CreateAssistantRequest {
	name: string;
	description: string;
	instructions: string;
	tools: string[];
	tool_resources: object;
	metadata: object;
	temperature: object;
	response_format: object;
}

declare class AssistantModel {
	constructor( options: { apiKey?: string } );
	getDefaultModel(): AssistantModelType;
	getDefaultApiKey(): string | null;
	getDefaultTemperature(): number;
	getParams( request: ChatCompletionRequest ): Record< string, any >;
	getHeaders( request: ChatCompletionRequest ): Record< string, string >;

	async createAssistant( model: CreateAssistantRequest ): Promise< any >;
	async createThread( request: CreateThreadRequest ): Promise< any >; // TODO CreateThreadResponse
	async deleteThread( threadId: string ): Promise< any >;
	async createThreadRun( request: RunThreadRequest ): Promise< any >;
	async getThreadRuns( threadId: string ): Promise< any >;
	async getThreadRun( threadId: string, runId: string ): Promise< any >;
	async createThreadMessage( threadId: string, message: Message ): Promise< any >;
	async getThreadMessages( threadId: string ): Promise< any >;
	static getInstance(
		service: AssistantModelService,
		apiKey: string | null
	): AssistantModel;
}

declare class OpenAIAssistantModel extends AssistantModel {}
declare class WPCOMOpenAIAssistantModel extends AssistantModel {}

export default AssistantModel;
export {
	AssistantModelService,
	AssistantModelType,
	OpenAIAssistantModel,
	WPCOMOpenAIAssistantModel,
};
