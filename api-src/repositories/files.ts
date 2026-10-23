import type { IncomingMessage, ServerResponse } from "http";
import { getRepositoryStore, sendJson } from "../../packages/shared/src/index";

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

  const file = project?.files?.get(path);
  if (file) {
    return sendJson(res, 200, {
      path: file.path,
      content: file.content,
      sizeBytes: file.sizeBytes,
      sha: file.sha,
    });
  }

  // Fallback: fetch raw content directly from GitHub if not in store
  const match = id.match(/^([a-zA-Z0-9_.-]+)-([a-zA-Z0-9_.-]+)-([a-zA-Z0-9]+)$/);
  if (match) {
    const [, owner, repo, sha] = match;
    try {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${sha}/${path}`;
      const resp = await fetch(rawUrl);
      if (resp.ok) {
        const content = await resp.text();
        return sendJson(res, 200, {
          path,
          content,
          sizeBytes: Buffer.byteLength(content, "utf-8"),
          sha,
        });
      }
    } catch {}
  }

  return sendJson(res, 404, { error: `File '${path}' not found in project.` });
}
