import type { IncomingMessage, ServerResponse } from "http";

export async function parseJsonBody<T = any>(req: IncomingMessage): Promise<T> {
  // 1. Check if body was already parsed by Vercel or Express middleware
  const existingBody = (req as any).body;
  if (existingBody !== undefined && existingBody !== null) {
    if (typeof existingBody === "string") {
      const trimmed = existingBody.trim();
      if (!trimmed) return {} as T;
      try {
        return JSON.parse(trimmed);
      } catch {
        return {} as T;
      }
    }
    return existingBody as T;
  }

  // 2. If the request stream has already ended or is complete (Vercel Node runtime)
  if (req.readableEnded || (req as any).complete) {
    return {} as T;
  }

  // 3. Otherwise read the stream with a safety timeout so it never hangs
  return new Promise((resolve) => {
    let raw = "";
    const timer = setTimeout(() => {
      resolve({} as T);
    }, 1500);

    req.on("data", (chunk) => {
      raw += chunk;
      // 10 MB payload limit guard
      if (raw.length > 10 * 1024 * 1024) {
        clearTimeout(timer);
        req.destroy();
        resolve({} as T);
      }
    });

    req.on("end", () => {
      clearTimeout(timer);
      if (!raw.trim()) {
        resolve({} as T);
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({} as T);
      }
    });

    req.on("error", () => {
      clearTimeout(timer);
      resolve({} as T);
    });
  });
}

export function sendJson(res: ServerResponse, statusCode: number, data: any): void {
  if (res.headersSent) return;

  try {
    res.statusCode = statusCode;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");
    res.end(JSON.stringify(data));
  } catch {
    // Fail-safe to prevent crashing the serverless worker
  }
}
