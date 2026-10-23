import { GoogleGenAI } from "@google/genai";
import type { AIProvider, GenerateOptions, GenerateResult, HealthCheckResult } from "./types";

export class GeminiProvider implements AIProvider {
  readonly id = "gemini";
  readonly name = "Google Gemini";
  readonly defaultModel: string;

  constructor(defaultModel?: string) {
    this.defaultModel = defaultModel || (typeof process !== "undefined" ? process.env?.GEMINI_MODEL : undefined) || "gemini-2.5-flash";
  }

  private getClient(apiKey?: string): GoogleGenAI {
    const key = apiKey || (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : undefined);
    if (!key) {
      throw new Error(
        "Gemini API key is not configured. Please set GEMINI_API_KEY in your environment or provide a personal API key in settings."
      );
    }
    return new GoogleGenAI({ apiKey: key });
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const client = this.getClient(options.apiKey);
    const model = options.model || this.defaultModel;

    // Convert messages to Gemini format
    const contents: any[] = [];
    for (const msg of options.messages) {
      if (msg.role === "system") continue;
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }

    if (contents.length === 0) {
      throw new Error("Cannot generate with empty messages array.");
    }

    const config: any = {};
    if (options.systemPrompt) {
      config.systemInstruction = options.systemPrompt;
    }
    if (options.maxOutputTokens) {
      config.maxOutputTokens = options.maxOutputTokens;
    }
    if (options.temperature !== undefined) {
      config.temperature = options.temperature;
    }

    // Bounded retries with exponential backoff for transient rate limits
    const maxRetries = 2;
    let attempt = 0;
    let delay = 1000;

    while (attempt <= maxRetries) {
      try {
        const response = await client.models.generateContent({
          model,
          contents,
          config,
        });

        const text = response.text || "";
        const usage = (response as any).usageMetadata
          ? {
              promptTokens: (response as any).usageMetadata.promptTokenCount,
              completionTokens: (response as any).usageMetadata.candidatesTokenCount,
              totalTokens: (response as any).usageMetadata.totalTokenCount,
            }
          : undefined;

        return {
          text,
          model,
          provider: "gemini",
          usage,
        };
      } catch (err: any) {
        const msg = String(err?.message || err);
        const status = err?.status || err?.statusCode;

        // Quota exhaustion vs transient rate limit
        if (status === 429 || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
          if (msg.toLowerCase().includes("quota exceeded") || msg.toLowerCase().includes("exhausted")) {
            throw new Error(
              "Gemini free-tier quota has been exhausted for this project. Please wait for quota refresh or supply your own key in Settings."
            );
          }
          if (attempt < maxRetries) {
            attempt++;
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2;
            continue;
          }
        }
        throw new Error(`Gemini API Error: ${msg}`);
      }
    }

    throw new Error("Gemini API request failed after retry attempts.");
  }

  async healthCheck(apiKey?: string): Promise<HealthCheckResult> {
    try {
      const client = this.getClient(apiKey);
      const model = this.defaultModel;
      const res = await client.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: "ping" }] }],
        config: { maxOutputTokens: 5 },
      });

      return {
        ok: true,
        provider: "gemini",
        model,
        message: "Gemini API connection healthy.",
      };
    } catch (err: any) {
      return {
        ok: false,
        provider: "gemini",
        message: err?.message || String(err),
      };
    }
  }

  async listModels(apiKey?: string): Promise<string[]> {
    const envKey = typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : undefined;
    const key = apiKey || envKey;
    if (!key) {
      return [this.defaultModel, "gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
    }

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.error?.message || `Google Gemini API error (${res.status})`;
        throw new Error(errMsg);
      }
      const data = (await res.json()) as any;
      if (data.models && Array.isArray(data.models)) {
        const models = data.models
          .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
          .map((m: any) => m.name.replace(/^models\//, ""))
          .filter((name: string) => !name.includes("embedding") && !name.includes("aqa"));
        if (models.length > 0) return models;
      }
      return [this.defaultModel];
    } catch (err: any) {
      if (apiKey) {
        throw err;
      }
      return [this.defaultModel, "gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
    }
  }
}
