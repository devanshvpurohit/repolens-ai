import type { AIProvider, GenerateOptions, GenerateResult, HealthCheckResult } from "./types.js";

export class AnthropicProvider implements AIProvider {
  readonly id = "anthropic";
  readonly name = "Anthropic Claude";
  readonly defaultModel: string;

  constructor(defaultModel?: string) {
    this.defaultModel = defaultModel || process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("Anthropic API key is missing. Please configure ANTHROPIC_API_KEY or provide your key in settings.");
    }

    const model = options.model || this.defaultModel;
    const messages = options.messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content }));

    const body: Record<string, any> = {
      model,
      messages,
      max_tokens: options.maxOutputTokens || 1024,
      temperature: options.temperature ?? 0.2,
    };

    if (options.systemPrompt) {
      body.system = options.systemPrompt;
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
      signal: options.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Anthropic API error (${res.status}): ${errText}`);
    }

    const data = (await res.json()) as any;
    const text = data.content?.[0]?.text || "";

    return {
      text,
      model,
      provider: "anthropic",
      usage: data.usage
        ? {
            promptTokens: data.usage.input_tokens,
            completionTokens: data.usage.output_tokens,
            totalTokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0),
          }
        : undefined,
    };
  }

  async healthCheck(apiKey?: string): Promise<HealthCheckResult> {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
      return { ok: false, provider: "anthropic", message: "ANTHROPIC_API_KEY not configured." };
    }

    try {
      // Test message
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: this.defaultModel,
          messages: [{ role: "user", content: "hi" }],
          max_tokens: 5,
        }),
      });

      if (res.ok) {
        return { ok: true, provider: "anthropic", model: this.defaultModel, message: "Anthropic connection healthy." };
      }
      return { ok: false, provider: "anthropic", message: `Anthropic error (${res.status})` };
    } catch (err: any) {
      return { ok: false, provider: "anthropic", message: err?.message || String(err) };
    }
  }
}
