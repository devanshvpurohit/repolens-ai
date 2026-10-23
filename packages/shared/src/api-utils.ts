import type { IncomingMessage, ServerResponse } from "http";

export async function parseJsonBody<T = any>(req: IncomingMessage): Promise<T> {
  if ((req as any).body) {
    if (typeof (req as any).body === "string") {
      return JSON.parse((req as any).body);
    }
    return (req as any).body as T;
  }

  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      // 10 MB payload limit guard
      if (raw.length > 10 * 1024 * 1024) {
        req.destroy();
        reject(new Error("Payload too large (exceeds 10MB limit)"));
      }
    });

    req.on("end", () => {
      if (!raw.trim()) {
        resolve({} as T);
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (err: any) {
        reject(new Error(`Invalid JSON payload: ${err.message}`));
      }
    });

    req.on("error", (err) => reject(err));
  });
}

export function sendJson(res: ServerResponse, statusCode: number, data: any): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");
  res.end(JSON.stringify(data));
}
