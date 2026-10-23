import type { IncomingMessage, ServerResponse } from "http";
import { defaultProviderManager, type ProviderId } from "@repolens/ai-providers";
import { parseJsonBody, sendJson } from "@repolens/shared";
import { z } from "zod";

const FetchModelsSchema = z.object({
  provider: z.enum(["gemini", "openai", "anthropic", "ollama"]).default("gemini"),
  apiKey: z.string().optional(),
});

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method === "OPTIONS") {
    return sendJson(res, 200, { ok: true });
  }

  try {
    let providerId: ProviderId = "gemini";
    let apiKey: string | undefined;

    if (req.method === "GET") {
      const url = new URL(req.url || "/", "http://localhost");
      providerId = (url.searchParams.get("provider") as ProviderId) || "gemini";
      apiKey = url.searchParams.get("apiKey") || undefined;
    } else if (req.method === "POST") {
      const body = await parseJsonBody(req);
      const parsed = FetchModelsSchema.parse(body);
      providerId = parsed.provider;
      apiKey = parsed.apiKey;
    } else {
      return sendJson(res, 405, { error: "Method not allowed." });
    }

    const provider = defaultProviderManager.getProvider(providerId);
    const models = await provider.listModels(apiKey);

    return sendJson(res, 200, {
      provider: providerId,
      models,
      defaultModel: provider.defaultModel,
    });
  } catch (err: any) {
    return sendJson(res, 500, {
      error: err.message || "Failed to fetch model list",
    });
  }
}
