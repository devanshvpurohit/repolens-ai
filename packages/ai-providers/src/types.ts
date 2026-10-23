export type ProviderId = "gemini" | "openai" | "anthropic" | "ollama";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface GenerateOptions {
  systemPrompt?: string;
  messages: ChatMessage[];
  maxOutputTokens?: number;
  temperature?: number;
  apiKey?: string;
  model?: string;
  signal?: AbortSignal;
}

export interface GenerateResult {
  text: string;
  model: string;
  provider: ProviderId;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface HealthCheckResult {
  ok: boolean;
  provider: ProviderId;
  message?: string;
  model?: string;
}

export interface AIProvider {
  id: ProviderId;
  name: string;
  defaultModel: string;
  generate(options: GenerateOptions): Promise<GenerateResult>;
  healthCheck(apiKey?: string): Promise<HealthCheckResult>;
}
