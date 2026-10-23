import { GitHubClient, type RepoMetadata } from "@repolens/github-ingestion";
import { buildKnowledgeGraph } from "@repolens/analysis-adapter";
import type { KnowledgeGraph } from "@repolens/graph-schema";
import { chunkSourceFile, type SourceChunk } from "@repolens/retrieval";

export interface ClientAnalyzeResult {
  projectId: string;
  metadata: RepoMetadata;
  graph: KnowledgeGraph;
  files: Map<string, string>;
  chunks: SourceChunk[];
}

export class ClientAnalyzer {
  static async analyze(
    repoUrl: string,
    maxFiles = 60,
    onProgress?: (progress: number, stage: string) => void
  ): Promise<ClientAnalyzeResult> {
    const client = new GitHubClient();

    onProgress?.(15, "Connecting to GitHub & resolving repository...");
    const meta = await client.resolveRepository(repoUrl);
    const projectId = `${meta.owner}-${meta.repo}-${meta.commitSha.slice(0, 7)}`;

    onProgress?.(30, "Fetching file tree structure from GitHub...");
    const tree = await client.fetchFilteredTree(meta, { maxFiles });

    onProgress?.(50, `Fetching source content for ${tree.length} files...`);
    const paths = tree.map((t) => t.path);
    const fetchedFiles = await client.fetchBatchFiles(meta, paths, 10, 10000);

    onProgress?.(75, "Running deterministic AST parser & building knowledge graph...");
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

    onProgress?.(90, "Indexing symbols and chunking source for retrieval...");
    const filesMap = new Map<string, string>();
    const allChunks: SourceChunk[] = [];
    for (const f of fetchedFiles) {
      filesMap.set(f.path, f.content);
      const chunks = chunkSourceFile(f.path, f.content, meta.commitSha);
      allChunks.push(...chunks);
    }

    onProgress?.(100, "Analysis complete!");

    return {
      projectId,
      metadata: meta,
      graph,
      files: filesMap,
      chunks: allChunks,
    };
  }
}
