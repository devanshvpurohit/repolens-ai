import type { KnowledgeGraph } from "@repolens/graph-schema";
import type { RepoMetadata } from "@repolens/github-ingestion";

export interface InspectResponse {
  metadata: RepoMetadata;
  totalEligibleFiles: number;
  filePreview: string[];
}

export interface AnalyzeResponse {
  jobId: string;
  projectId: string;
  status: string;
  progress: number;
  graph?: KnowledgeGraph;
  cached?: boolean;
}

export interface JobStatusResponse {
  jobId: string;
  status: string;
  progress: number;
  currentStage: string;
  totalFiles: number;
  processedFiles: number;
  errorMessage?: string;
  updatedAt: string;
}

export interface GraphResponse {
  projectId: string;
  name: string;
  metadata: RepoMetadata;
  graph: KnowledgeGraph;
  filesCount: number;
}

export interface FileContentResponse {
  path: string;
  content: string;
  sizeBytes: number;
  sha: string;
}

export interface ChatResponse {
  answer: string;
  model: string;
  provider: string;
  citations: Array<{
    path: string;
    startLine: number;
    endLine: number;
    commitSha: string;
    snippet?: string;
  }>;
  limitations?: string[];
  usage?: { promptTokens?: number; completionTokens?: number };
}

export class ApiClient {
  private static async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetch(endpoint, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!res.ok) {
      let errMsg = `Request failed (${res.status})`;
      try {
        const data = await res.json();
        errMsg = data.error || data.message || errMsg;
      } catch {
        errMsg = await res.text();
      }
      throw new Error(errMsg);
    }

    return res.json() as Promise<T>;
  }

  static async inspectRepo(repoUrl: string): Promise<InspectResponse> {
    return this.request<InspectResponse>("/api/repositories/inspect", {
      method: "POST",
      body: JSON.stringify({ repoUrl }),
    });
  }

  static async analyzeRepo(repoUrl: string, maxFiles = 200): Promise<AnalyzeResponse> {
    return this.request<AnalyzeResponse>("/api/repositories/analyze", {
      method: "POST",
      body: JSON.stringify({ repoUrl, maxFiles }),
    });
  }

  static async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    return this.request<JobStatusResponse>(`/api/repositories/status?jobId=${encodeURIComponent(jobId)}`);
  }

  static async getGraph(projectId: string): Promise<GraphResponse> {
    return this.request<GraphResponse>(`/api/repositories/graph?id=${encodeURIComponent(projectId)}`);
  }

  static async listProjects(): Promise<{ projects: any[] }> {
    return this.request<{ projects: any[] }>("/api/repositories/graph?list=true");
  }

  static async getFile(projectId: string, path: string): Promise<FileContentResponse> {
    return this.request<FileContentResponse>(
      `/api/repositories/files?id=${encodeURIComponent(projectId)}&path=${encodeURIComponent(path)}`
    );
  }

  static async searchRepo(projectId: string, query: string): Promise<any> {
    return this.request<any>(
      `/api/repositories/search?id=${encodeURIComponent(projectId)}&q=${encodeURIComponent(query)}`
    );
  }

  static async chat(data: {
    projectId: string;
    message: string;
    provider?: string;
    model?: string;
    apiKey?: string;
  }): Promise<ChatResponse> {
    return this.request<ChatResponse>("/api/chat", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async getProviderSettings(): Promise<any> {
    return this.request<any>("/api/settings/providers");
  }

  static async testProvider(provider: string, apiKey?: string): Promise<any> {
    return this.request<any>("/api/settings/providers", {
      method: "POST",
      body: JSON.stringify({ provider, apiKey }),
    });
  }
}
