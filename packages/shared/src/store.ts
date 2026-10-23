import type { KnowledgeGraph } from "@repolens/graph-schema";
import type { RepoMetadata, IngestedFile } from "@repolens/github-ingestion";
import type { SourceChunk } from "@repolens/retrieval";

export type AnalysisJobStatus =
  | "queued"
  | "fetching"
  | "scanning"
  | "building-graph"
  | "indexing"
  | "enriching"
  | "completed"
  | "failed"
  | "cancelled";

export interface AnalysisJob {
  id: string;
  repoUrl: string;
  owner: string;
  repo: string;
  commitSha: string;
  status: AnalysisJobStatus;
  progress: number; // 0 - 100
  currentStage: string;
  errorMessage?: string;
  totalFiles: number;
  processedFiles: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoredProject {
  id: string;
  name: string;
  owner: string;
  repo: string;
  commitSha: string;
  repoUrl: string;
  metadata: RepoMetadata;
  graph: KnowledgeGraph;
  files: Map<string, IngestedFile>;
  chunks: SourceChunk[];
  createdAt: string;
}

export class MemoryStore {
  private readonly projects = new Map<string, StoredProject>();
  private readonly jobs = new Map<string, AnalysisJob>();

  saveJob(job: AnalysisJob): void {
    job.updatedAt = new Date().toISOString();
    this.jobs.set(job.id, job);
    try {
      if (typeof process !== "undefined" && process.platform) {
        const fs = require("fs");
        fs.writeFileSync(`/tmp/repolens_job_${job.id}.json`, JSON.stringify(job));
      }
    } catch {}
  }

  getJob(id: string): AnalysisJob | undefined {
    let job = this.jobs.get(id);
    if (!job) {
      try {
        if (typeof process !== "undefined" && process.platform) {
          const fs = require("fs");
          const tmpPath = `/tmp/repolens_job_${id}.json`;
          if (fs.existsSync(tmpPath)) {
            job = JSON.parse(fs.readFileSync(tmpPath, "utf-8"));
            if (job) this.jobs.set(id, job);
          }
        }
      } catch {}
    }
    return job;
  }

  saveProject(project: StoredProject): void {
    this.projects.set(project.id, project);
    try {
      if (typeof process !== "undefined" && process.platform) {
        const fs = require("fs");
        const tmpPath = `/tmp/repolens_${project.id}.json`;
        const serializedFiles = Array.from(project.files.entries());
        fs.writeFileSync(
          tmpPath,
          JSON.stringify({
            ...project,
            files: serializedFiles,
          })
        );
      }
    } catch {}
  }

  getProject(id: string): StoredProject | undefined {
    let project = this.projects.get(id);
    if (!project) {
      try {
        if (typeof process !== "undefined" && process.platform) {
          const fs = require("fs");
          const tmpPath = `/tmp/repolens_${id}.json`;
          if (fs.existsSync(tmpPath)) {
            const raw = JSON.parse(fs.readFileSync(tmpPath, "utf-8"));
            project = {
              ...raw,
              files: new Map(raw.files || []),
            };
            if (project) this.projects.set(id, project);
          }
        }
      } catch {}
    }
    return project;
  }

  findProjectByRepo(owner: string, repo: string, commitSha?: string): StoredProject | undefined {
    for (const p of this.projects.values()) {
      if (p.owner.toLowerCase() === owner.toLowerCase() && p.repo.toLowerCase() === repo.toLowerCase()) {
        if (!commitSha || p.commitSha === commitSha) {
          return p;
        }
      }
    }
    return undefined;
  }

  listProjects(): Array<Omit<StoredProject, "files" | "chunks">> {
    return Array.from(this.projects.values()).map((p) => ({
      id: p.id,
      name: p.name,
      owner: p.owner,
      repo: p.repo,
      commitSha: p.commitSha,
      repoUrl: p.repoUrl,
      metadata: p.metadata,
      graph: p.graph,
      createdAt: p.createdAt,
    }));
  }
}

// Global singleton for serverless container reuse
import { getDemoProject } from "./demo-data";

const globalStore = (globalThis as any).__repolens_store || new MemoryStore();
if (!globalStore.getProject("demo-express-react-app")) {
  globalStore.saveProject(getDemoProject());
}
(globalThis as any).__repolens_store = globalStore;

export function getRepositoryStore(): MemoryStore {
  return globalStore;
}
