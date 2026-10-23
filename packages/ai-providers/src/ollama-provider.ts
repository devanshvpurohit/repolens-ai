import type { AIProvider, GenerateOptions, GenerateResult, HealthCheckResult } from "./types";

export class OllamaProvider implements AIProvider {
  readonly id = "ollama";
  readonly name = "Ollama";
  readonly defaultModel: string;
  private readonly baseUrl: string;

  constructor(defaultModel?: string, baseUrl?: string) {
    this.defaultModel = defaultModel || process.env.OLLAMA_MODEL || "llama3.2";
    this.baseUrl = (baseUrl || process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
  }

  private validateEndpoint(urlStr: string): void {
    const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
    try {
      const parsed = new URL(urlStr);
      // In production, block localhost/private IP SSRF
      if (isProd) {
        const host = parsed.hostname.toLowerCase();
        if (
          host === "localhost" ||
          host === "127.0.0.1" ||
          host === "0.0.0.0" ||
          host === "::1" ||
          host === "169.254.169.254"
        ) {
          throw new Error(
            "Local Ollama (127.0.0.1) cannot be accessed directly from a hosted Vercel function. Please run RepoLens AI locally (pnpm dev) or configure a secure authenticated remote endpoint."
          );
        }
      }
    } catch (e: any) {
      throw new Error(`Invalid Ollama endpoint: ${e.message}`);
    }
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    this.validateEndpoint(this.baseUrl);

    const model = options.model || this.defaultModel;
    const promptParts: string[] = [];

    if (options.systemPrompt) {
      promptParts.push(`System: ${options.systemPrompt}\n`);
    }
    for (const msg of options.messages) {
      promptParts.push(`${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}\n`);
    }

    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt: promptParts.join("\n"),
        stream: false,
        options: {
          temperature: options.temperature ?? 0.2,
          num_predict: options.maxOutputTokens || 1024,
        },
      }),
      signal: options.signal,
    });

    if (!res.ok) {
      throw new Error(`Ollama error (${res.status}): ${await res.text()}`);
    }

    const data = (await res.json()) as any;
    return {
      text: data.response || "",
      model,
      provider: "ollama",
    };
  }

  async healthCheck(): Promise<HealthCheckResult> {
    try {
      this.validateEndpoint(this.baseUrl);
      const res = await fetch(`${this.baseUrl}/api/tags`);
      if (res.ok) {
        return { ok: true, provider: "ollama", model: this.defaultModel, message: "Ollama instance reachable." };
      }
      return { ok: false, provider: "ollama", message: `Ollama returned status ${res.status}` };
    } catch (err: any) {
      return { ok: false, provider: "ollama", message: err?.message || String(err) };
    }
  }

  async listModels(): Promise<string[]> {
    try {
      this.validateEndpoint(this.baseUrl);
      const res = await fetch(`${this.baseUrl}/api/tags`);
      if (res.ok) {
        const data = (await res.json()) as any;
        if (data.models && Array.isArray(data.models)) {
          return data.models.map((m: any) => m.name);
        }
      }
      return [this.defaultModel, "llama3.2", "codellama", "mistral"];
    } catch {
      return [this.defaultModel, "llama3.2", "codellama", "mistral"];
    }
  }
}
