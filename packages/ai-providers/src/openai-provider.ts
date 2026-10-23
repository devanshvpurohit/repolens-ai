import type { AIProvider, GenerateOptions, GenerateResult, HealthCheckResult } from "./types.js";

export class OpenAIProvider implements AIProvider {
  readonly id = "openai";
  readonly name = "OpenAI";
  readonly defaultModel: string;

  constructor(defaultModel?: string) {
    this.defaultModel = defaultModel || process.env.OPENAI_MODEL || "gpt-4o-mini";
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API key is missing. Please configure OPENAI_API_KEY or provide your key in settings.");
    }

    const model = options.model || this.defaultModel;
    const messages: Array<{ role: string; content: string }> = [];

    if (options.systemPrompt) {
      messages.push({ role: "system", content: options.systemPrompt });
    }
    for (const msg of options.messages) {
      messages.push({ role: msg.role, content: msg.content });
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: options.maxOutputTokens || 1024,
        temperature: options.temperature ?? 0.2,
      }),
      signal: options.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${errText}`);
    }

    const data = (await res.json()) as any;
    const choice = data.choices?.[0];
    const text = choice?.message?.content || "";

    return {
      text,
      model,
      provider: "openai",
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }

  async healthCheck(apiKey?: string): Promise<HealthCheckResult> {
    const key = apiKey || process.env.OPENAI_API_KEY;
    if (!key) {
      return { ok: false, provider: "openai", message: "OPENAI_API_KEY not configured." };
    }

    try {
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (res.ok) {
        return { ok: true, provider: "openai", model: this.defaultModel, message: "OpenAI connection healthy." };
      }
      return { ok: false, provider: "openai", message: `OpenAI returned status ${res.status}` };
    } catch (err: any) {
      return { ok: false, provider: "openai", message: err?.message || String(err) };
    }
  }

  async listModels(apiKey?: string): Promise<string[]> {
    const key = apiKey || process.env.OPENAI_API_KEY;
    if (!key) {
      return [this.defaultModel, "gpt-4o-mini", "gpt-4o", "o3-mini"];
    }

    try {
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (!res.ok) {
        throw new Error(`OpenAI API error (${res.status})`);
      }
      const data = (await res.json()) as any;
      if (data.data && Array.isArray(data.data)) {
        const models = data.data
          .map((m: any) => m.id)
          .filter((id: string) => id.includes("gpt") || id.startsWith("o1") || id.startsWith("o3"))
          .sort();
        if (models.length > 0) return models;
      }
      return [this.defaultModel];
    } catch {
      return [this.defaultModel, "gpt-4o-mini", "gpt-4o", "o3-mini"];
    }
  }
}
