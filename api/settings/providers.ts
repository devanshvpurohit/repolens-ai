import type { IncomingMessage, ServerResponse } from "http";
import { defaultProviderManager, type ProviderId } from "@repolens/ai-providers";
import { parseJsonBody, sendJson } from "@repolens/shared";
import { z } from "zod";

const TestProviderSchema = z.object({
  provider: z.enum(["gemini", "openai", "anthropic", "ollama"]),
  apiKey: z.string().optional(),
});

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method === "OPTIONS") {
    return sendJson(res, 200, { ok: true });
  }

  // GET: List configured providers and default settings
  if (req.method === "GET") {
    const list = defaultProviderManager.getAllProviders().map((p) => {
      let isConfigured = false;
      if (p.id === "gemini") isConfigured = !!process.env.GEMINI_API_KEY;
      if (p.id === "openai") isConfigured = !!process.env.OPENAI_API_KEY;
      if (p.id === "anthropic") isConfigured = !!process.env.ANTHROPIC_API_KEY;
      if (p.id === "ollama") isConfigured = true;

      return {
        id: p.id,
        name: p.name,
        defaultModel: p.defaultModel,
        isConfigured,
        supportsByok: true,
      };
    });

    return sendJson(res, 200, {
      defaultProvider: "gemini",
      providers: list,
    });
  }

  // POST: Test provider connectivity with optional BYOK key
  if (req.method === "POST") {
    try {
      const body = await parseJsonBody(req);
      const parsed = TestProviderSchema.parse(body);

      const provider = defaultProviderManager.getProvider(parsed.provider as ProviderId);
      const health = await provider.healthCheck(parsed.apiKey);

      return sendJson(res, 200, health);
    } catch (err: any) {
      return sendJson(res, 400, {
        ok: false,
        message: err.message || "Failed to test provider",
      });
    }
  }

  return sendJson(res, 405, { error: "Method not allowed." });
}
