import type { IncomingMessage, ServerResponse } from "http";
import { defaultProviderManager, type ProviderId } from "../../packages/ai-providers/src/index";
import { parseJsonBody, sendJson } from "../../packages/shared/src/index";
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
      const parsed = FetchModelsSchema.safeParse(body);
      if (parsed.success) {
        providerId = parsed.data.provider;
        apiKey = parsed.data.apiKey;
      }
    } else {
      return sendJson(res, 405, { error: "Method not allowed." });
    }

    const provider = defaultProviderManager.getProvider(providerId);
    let models: string[] = [];
    try {
      models = await provider.listModels(apiKey);
    } catch (err: any) {
      console.warn("Could not retrieve models for provider:", err.message);
      models = [provider.defaultModel];
    }

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
