import type { IncomingMessage, ServerResponse } from "http";
import { getRepositoryStore, sendJson } from "../../packages/shared/src/index";
import { GitHubClient } from "../../packages/github-ingestion/src/index";
import { buildKnowledgeGraph } from "../../packages/analysis-adapter/src/index";
import { chunkSourceFile, type SourceChunk } from "../../packages/retrieval/src/index";

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

  let project = store.getProject(id);

  // On-demand auto-ingestion fallback from GitHub if not found in memory or /tmp
  if (!project) {
    const match = id.match(/^([a-zA-Z0-9_.-]+)-([a-zA-Z0-9_.-]+)-([a-zA-Z0-9]+)$/);
    if (match) {
      try {
        const [, owner, repo] = match;
        const client = new GitHubClient();
        const meta = await client.resolveRepository(`https://github.com/${owner}/${repo}`);
        const tree = await client.fetchFilteredTree(meta, { maxFiles: 40 });
        const paths = tree.map((t) => t.path);
        const fetchedFiles = await client.fetchBatchFiles(meta, paths, 10, 4000);
        const graph = buildKnowledgeGraph({
          projectMeta: {
            name: meta.name,
            owner: meta.owner,
            languages: [meta.primaryLanguage],
            frameworks: [],
            description: meta.description,
            analyzedAt: new Date().toISOString(),
            gitCommitHash: meta.commitSha,
          },
          files: fetchedFiles,
        });

        const filesMap = new Map();
        const allChunks: SourceChunk[] = [];
        for (const f of fetchedFiles) {
          filesMap.set(f.path, f);
          const chunks = chunkSourceFile(f.path, f.content, meta.commitSha);
          allChunks.push(...chunks);
        }

        project = {
          id,
          name: meta.name,
          owner: meta.owner,
          repo: meta.repo,
          commitSha: meta.commitSha,
          repoUrl: `https://github.com/${owner}/${repo}`,
          metadata: meta,
          graph,
          files: filesMap,
          chunks: allChunks,
          createdAt: new Date().toISOString(),
        };

        store.saveProject(project);
      } catch (err: any) {
        console.warn("Auto-ingestion fallback error in graph route:", err.message);
      }
    }
  }

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
