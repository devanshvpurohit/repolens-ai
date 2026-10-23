import type { IncomingMessage, ServerResponse } from "http";
import { defaultProviderManager, type ProviderId } from "@repolens/ai-providers";
import { parseJsonBody, sendJson } from "@repolens/shared";
import { z } from "zod";

const TestProviderSchema = z.object({
  provider: z.enum(["gemini", "openai", "anthropic", "ollama"]),
  apiKey: z.string().optional(),
  action: z.enum(["test", "models"]).optional(),
});

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method === "OPTIONS") {
    return sendJson(res, 200, { ok: true });
  }

  // GET: List configured providers or query models
  if (req.method === "GET") {
    const url = new URL(req.url || "/", "http://localhost");
    const action = url.searchParams.get("action");
    const providerParam = url.searchParams.get("provider") as ProviderId | null;
    const apiKey = url.searchParams.get("apiKey") || undefined;

    if (action === "models" && providerParam) {
      try {
        const provider = defaultProviderManager.getProvider(providerParam);
        const models = await provider.listModels(apiKey);
        return sendJson(res, 200, { provider: providerParam, models });
      } catch (err: any) {
        return sendJson(res, 400, { error: err.message });
      }
    }

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

  // POST: Test provider connectivity with optional BYOK key or fetch models
  if (req.method === "POST") {
    try {
      const body = await parseJsonBody(req);
      const parsed = TestProviderSchema.safeParse(body);
      if (!parsed.success) {
        return sendJson(res, 400, {
          ok: false,
          message: parsed.error.errors[0]?.message || "Invalid request payload",
        });
      }

      const provider = defaultProviderManager.getProvider(parsed.data.provider as ProviderId);

      if (parsed.data.action === "models") {
        const models = await provider.listModels(parsed.data.apiKey);
        return sendJson(res, 200, { provider: parsed.data.provider, models });
      }

      const health = await provider.healthCheck(parsed.data.apiKey);
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
