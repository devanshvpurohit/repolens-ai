import type { AIProvider, ProviderId } from "./types.js";
import { GeminiProvider } from "./gemini-provider.js";
import { OpenAIProvider } from "./openai-provider.js";
import { AnthropicProvider } from "./anthropic-provider.js";
import { OllamaProvider } from "./ollama-provider.js";

export class ProviderManager {
  private readonly providers = new Map<ProviderId, AIProvider>();

  constructor() {
    this.providers.set("gemini", new GeminiProvider());
    this.providers.set("openai", new OpenAIProvider());
    this.providers.set("anthropic", new AnthropicProvider());
    this.providers.set("ollama", new OllamaProvider());
  }

  getProvider(id: ProviderId): AIProvider {
    const p = this.providers.get(id);
    if (!p) {
      throw new Error(`Unknown provider: '${id}'`);
    }
    return p;
  }

  getAllProviders(): Array<{ id: ProviderId; name: string; defaultModel: string }> {
    return Array.from(this.providers.values()).map((p) => ({
      id: p.id,
      name: p.name,
      defaultModel: p.defaultModel,
    }));
  }
}

export const defaultProviderManager = new ProviderManager();
