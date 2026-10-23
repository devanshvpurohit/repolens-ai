import type { IncomingMessage, ServerResponse } from "http";
import { getRepositoryStore, sendJson } from "@repolens/shared";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method not allowed. Use GET." });
  }

  const url = new URL(req.url || "/", "http://localhost");
  const id = url.searchParams.get("id");
  const path = url.searchParams.get("path");

  if (!id || !path) {
    return sendJson(res, 400, { error: "Both 'id' and 'path' query parameters are required." });
  }

  const store = getRepositoryStore();
  const project = store.getProject(id);

  if (!project) {
    return sendJson(res, 404, { error: `Project '${id}' not found.` });
  }

  const file = project.files.get(path);
  if (!file) {
    return sendJson(res, 404, { error: `File '${path}' not found in project.` });
  }

  return sendJson(res, 200, {
    path: file.path,
    content: file.content,
    sizeBytes: file.sizeBytes,
    sha: file.sha,
  });
}
