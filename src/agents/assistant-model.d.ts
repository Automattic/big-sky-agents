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
	max_prompt_tokens?: number;
	max_completion_tokens?: number;
	truncation_strategy?: string;
	response_format?: object;
}

declare class AssistantModel {
	constructor( options: { apiKey?: string } );
	getDefaultModel(): AssistantModelType;
	getDefaultApiKey(): string | null;
	getDefaultTemperature(): number;
	getParams( request: ChatCompletionRequest ): Record< string, any >;
	getHeaders( request: ChatCompletionRequest ): Record< string, string >;

	async createThread( request: CreateThreadRequest ): Promise< any >; // TODO CreateThreadResponse
	async createThreadRun( request: RunThreadRequest ): Promise< any >;
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
