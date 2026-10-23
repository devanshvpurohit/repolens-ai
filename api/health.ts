import type { IncomingMessage, ServerResponse } from "http";
import { defaultProviderManager } from "@repolens/ai-providers";
import { PostgresStore } from "@repolens/shared";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Content-Type", "application/json");

  try {
    const pg = new PostgresStore();
    const providers = defaultProviderManager.getAllProviders();

    return res.end(
      JSON.stringify({
        status: "ok",
        service: "RepoLens AI",
        timestamp: new Date().toISOString(),
        providers,
        database: {
          configured: pg.isAvailable(),
          type: pg.isAvailable() ? "PostgreSQL" : "In-Memory Ephemeral",
        },
      })
    );
  } catch (err: any) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ status: "error", message: err.message }));
  }
}
