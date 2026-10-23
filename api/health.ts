import type { IncomingMessage, ServerResponse } from "http";
import { defaultProviderManager } from "../packages/ai-providers/src/index";
import { PostgresStore, sendJson } from "../packages/shared/src/index";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method === "OPTIONS") {
    return sendJson(res, 200, { ok: true });
  }

  try {
    const pg = new PostgresStore();
    const providers = defaultProviderManager.getAllProviders();

    return sendJson(res, 200, {
      status: "ok",
      service: "RepoLens AI",
      timestamp: new Date().toISOString(),
      providers,
      database: {
        configured: pg.isAvailable(),
        type: pg.isAvailable() ? "PostgreSQL" : "In-Memory Ephemeral",
      },
    });
  } catch (err: any) {
    return sendJson(res, 500, { status: "error", message: err.message });
  }
}
