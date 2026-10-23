import type { IncomingMessage, ServerResponse } from "http";
import { getRepositoryStore, sendJson } from "@repolens/shared";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method not allowed. Use GET." });
  }

  const url = new URL(req.url || "/", "http://localhost");
  const id = url.searchParams.get("id");
  const isList = url.searchParams.get("list") === "true";

  const store = getRepositoryStore();

  if (isList || !id) {
    const list = store.listProjects();
    return sendJson(res, 200, { projects: list });
  }

  const project = store.getProject(id);
  if (!project) {
    return sendJson(res, 404, { error: `Project '${id}' not found.` });
  }

  return sendJson(res, 200, {
    projectId: project.id,
    name: project.name,
    metadata: project.metadata,
    graph: project.graph,
    filesCount: project.files.size,
  });
}
