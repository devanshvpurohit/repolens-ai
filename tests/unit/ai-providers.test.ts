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
});
