import { describe, it, expect, vi } from "vitest";
import { GeminiProvider } from "@repolens/ai-providers";
import { OpenAIProvider } from "@repolens/ai-providers";
import { AnthropicProvider } from "@repolens/ai-providers";
import { OllamaProvider } from "@repolens/ai-providers";

describe("AI Providers - Adapters & Safety", () => {
  it("Gemini provider reports missing API key cleanly", async () => {
    delete process.env.GEMINI_API_KEY;
    const provider = new GeminiProvider();
    await expect(
      provider.generate({ messages: [{ role: "user", content: "hello" }] })
    ).rejects.toThrow(/Gemini API key is not configured/);
  });

  it("OpenAI provider reports missing API key cleanly", async () => {
    delete process.env.OPENAI_API_KEY;
    const provider = new OpenAIProvider();
    await expect(
      provider.generate({ messages: [{ role: "user", content: "hello" }] })
    ).rejects.toThrow(/OpenAI API key is missing/);
  });

  it("Anthropic provider reports missing API key cleanly", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const provider = new AnthropicProvider();
    await expect(
      provider.generate({ messages: [{ role: "user", content: "hello" }] })
    ).rejects.toThrow(/Anthropic API key is missing/);
  });

  it("Ollama provider blocks localhost in production SSRF check", async () => {
    process.env.NODE_ENV = "production";
    const provider = new OllamaProvider("llama3.2", "http://127.0.0.1:11434");
    await expect(
      provider.generate({ messages: [{ role: "user", content: "hello" }] })
    ).rejects.toThrow(/Local Ollama \(127.0.0.1\) cannot be accessed directly from a hosted Vercel function/);
    process.env.NODE_ENV = "test";
  });

  it("Gemini provider listModels retrieves model list using API key", async () => {
    const key = process.env.GEMINI_API_KEY;
    const provider = new GeminiProvider();
    if (key) {
      const models = await provider.listModels(key);
      expect(models.length).toBeGreaterThan(0);
      expect(models.some((m) => m.includes("gemini"))).toBe(true);
    } else {
      const models = await provider.listModels();
      expect(models.length).toBeGreaterThan(0);
    }
  });

  it("Provider listModels gracefully provides default model list if no key is provided", async () => {
    delete process.env.GEMINI_API_KEY;
    const provider = new GeminiProvider();
    const models = await provider.listModels();
    expect(models).toContain("gemini-2.5-flash");
  });
});
