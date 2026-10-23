import type { IncomingMessage, ServerResponse } from "http";
import { GitHubClient } from "@repolens/github-ingestion";
import { buildKnowledgeGraph } from "@repolens/analysis-adapter";
import { chunkSourceFile, type SourceChunk } from "@repolens/retrieval";
import { getRepositoryStore, type AnalysisJob, parseJsonBody, sendJson } from "@repolens/shared";
import { z } from "zod";

const AnalyzeSchema = z.object({
  repoUrl: z.string().min(1, "Repository URL is required"),
  commitSha: z.string().optional(),
  maxFiles: z.number().min(1).max(1000).default(60),
});

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method === "OPTIONS") {
    return sendJson(res, 200, { ok: true });
  }
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed. Use POST." });
  }

  const store = getRepositoryStore();

  try {
    const body = await parseJsonBody(req);
    const parsed = AnalyzeSchema.safeParse(body);
    if (!parsed.success) {
      return sendJson(res, 400, { error: parsed.error.errors[0]?.message || "Invalid repository URL" });
    }

    const client = new GitHubClient();
    const meta = await client.resolveRepository(parsed.data.repoUrl);

    const projectId = `${meta.owner}-${meta.repo}-${meta.commitSha.slice(0, 7)}`;
    const jobId = `job-${projectId}`;

    // Check if already completed and cached
    const existingProject = store.getProject(projectId);
    if (existingProject) {
      return sendJson(res, 200, {
        jobId,
        projectId,
        status: "completed",
        progress: 100,
        cached: true,
      });
    }

    // Initialize or update job
    const job: AnalysisJob = {
      id: jobId,
      repoUrl: parsed.data.repoUrl,
      owner: meta.owner,
      repo: meta.repo,
      commitSha: meta.commitSha,
      status: "fetching",
      progress: 20,
      currentStage: "Fetching recursive file tree from GitHub",
      totalFiles: 0,
      processedFiles: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.saveJob(job);

    // 1. Fetch file tree
    const tree = await client.fetchFilteredTree(meta, { maxFiles: parsed.data.maxFiles });
    job.totalFiles = tree.length;
    job.status = "scanning";
    job.progress = 40;
    job.currentStage = `Fetching source code for ${tree.length} files`;
    store.saveJob(job);

    // 2. Fetch file contents in bounded batches with a strict 5s time budget
    const paths = tree.map((t) => t.path);
    const fetchedFiles = await client.fetchBatchFiles(meta, paths, 10, 5000);

    job.processedFiles = fetchedFiles.length;
    job.status = "building-graph";
    job.progress = 70;
    job.currentStage = "Running deterministic AST parser and relationship graph generation";
    store.saveJob(job);

    // 3. Build Knowledge Graph
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

    // 4. Index Source Chunks for RAG
    job.status = "indexing";
    job.progress = 85;
    job.currentStage = "Indexing symbols and chunking source for retrieval";
    store.saveJob(job);

    const allChunks: SourceChunk[] = [];
    const filesMap = new Map();
    for (const f of fetchedFiles) {
      filesMap.set(f.path, f);
      const chunks = chunkSourceFile(f.path, f.content, meta.commitSha);
      allChunks.push(...chunks);
    }

    // 5. Store Project
    store.saveProject({
      id: projectId,
      name: meta.name,
      owner: meta.owner,
      repo: meta.repo,
      commitSha: meta.commitSha,
      repoUrl: parsed.data.repoUrl,
      metadata: meta,
      graph,
      files: filesMap,
      chunks: allChunks,
      createdAt: new Date().toISOString(),
    });

    job.status = "completed";
    job.progress = 100;
    job.currentStage = "Analysis completed successfully";
    store.saveJob(job);

    return sendJson(res, 200, {
      jobId,
      projectId,
      status: "completed",
      progress: 100,
      graph,
    });
  } catch (err: any) {
    return sendJson(res, 500, {
      error: err.message || "Repository analysis failed",
    });
  }
}
