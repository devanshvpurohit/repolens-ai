import type { IncomingMessage, ServerResponse } from "http";
import { getRepositoryStore, sendJson } from "../../packages/shared/src/index";
import { RepositoryRetriever } from "../../packages/retrieval/src/index";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method not allowed. Use GET." });
  }

  const url = new URL(req.url || "/", "http://localhost");
  const id = url.searchParams.get("id");
  const q = url.searchParams.get("q") || "";

  if (!id) {
    return sendJson(res, 400, { error: "'id' query parameter is required." });
  }

  const store = getRepositoryStore();
  const project = store.getProject(id);

  if (!project) {
    return sendJson(res, 404, { error: `Project '${id}' not found.` });
  }

  // Search graph nodes first
  const queryLower = q.toLowerCase();
  const matchingNodes = project.graph.nodes.filter(
    (n) =>
      n.name.toLowerCase().includes(queryLower) ||
      (n.filePath && n.filePath.toLowerCase().includes(queryLower)) ||
      (n.summary && n.summary.toLowerCase().includes(queryLower))
  );

  // Search chunk content
  const retriever = new RepositoryRetriever(project.chunks, project.graph);
  const chunkResults = retriever.search(q, 10);

  return sendJson(res, 200, {
    query: q,
    nodes: matchingNodes.slice(0, 20),
    chunks: chunkResults.map((r) => ({
      filePath: r.chunk.filePath,
      startLine: r.chunk.startLine,
      endLine: r.chunk.endLine,
      symbolName: r.chunk.symbolName,
      score: r.score,
      reason: r.reason,
    })),
  });
}
