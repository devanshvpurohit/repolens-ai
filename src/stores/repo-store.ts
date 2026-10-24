import { create } from "zustand";
import type { KnowledgeGraph, GraphNode } from "@repolens/graph-schema";
import type { RepoMetadata } from "@repolens/github-ingestion";
import type { AuditReport, AuditItem } from "@repolens/analysis-adapter";
import { RepoAuditor } from "@repolens/analysis-adapter";
import type { SourceChunk } from "@repolens/retrieval";
import { RepositoryRetriever } from "@repolens/retrieval";
import { ApiClient } from "@/lib/api-client";
import { ClientAnalyzer } from "@/services/client-analyzer";
import { ClientModelFetcher } from "@/services/client-model-fetcher";
import { getDemoProject } from "@repolens/shared";

export interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Array<{
    path: string;
    startLine: number;
    endLine: number;
    commitSha: string;
  }>;
  timestamp: string;
}

interface RepoState {
  // Project & Graph
  projectId: string | null;
  metadata: RepoMetadata | null;
  graph: KnowledgeGraph | null;
  isLoading: boolean;
  error: string | null;

  // Selected Node & File viewer
  selectedNode: GraphNode | null;
  activeFilePath: string | null;
  activeFileContent: string | null;
  activeLineRange: [number, number] | null;
  isLoadingFile: boolean;

  // Graph Filters
  selectedTypeFilter: string | null;
  selectedLayerId: string | null;
  searchFilter: string;

  // AI & Chat Settings
  activeProvider: string;
  activeModel: string;
  byokKeys: Record<string, string>;
  availableModels: Record<string, string[]>;
  isFetchingModels: boolean;
  isApiKeyModalOpen: boolean;
  chatMessages: ChatMessageItem[];
  isChatLoading: boolean;

  // Code Audit
  auditReport: AuditReport | null;
  isAuditing: boolean;

  // Local client cache
  filesCache: Map<string, string>;
  chunksCache: SourceChunk[];

  // Actions
  setProjectId: (id: string) => void;
  setProjectData: (
    id: string,
    graph: KnowledgeGraph,
    metadata: RepoMetadata,
    files?: Map<string, string>,
    chunks?: SourceChunk[]
  ) => void;
  loadProject: (id: string) => Promise<void>;
  selectNode: (node: GraphNode | null) => void;
  loadFile: (path: string, lineRange?: [number, number]) => Promise<void>;
  setTypeFilter: (type: string | null) => void;
  setLayerFilter: (layerId: string | null) => void;
  setSearchFilter: (query: string) => void;
  setProvider: (provider: string, model?: string) => void;
  setModel: (model: string) => void;
  setByokKey: (provider: string, key: string) => void;
  fetchModelsForProvider: (provider: string, apiKey?: string) => Promise<string[]>;
  openApiKeyModal: () => void;
  closeApiKeyModal: () => void;
  sendChatMessage: (message: string) => Promise<void>;
  clearChat: () => void;
  runAudit: (projectId?: string, useAi?: boolean) => Promise<AuditReport | null>;
}

const DEFAULT_MODELS: Record<string, string[]> = {
  gemini: ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"],
  openai: ["gpt-4o-mini", "gpt-4o", "o3-mini", "gpt-4-turbo"],
  anthropic: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"],
  ollama: ["llama3.2", "codellama", "mistral", "qwen2.5-coder"],
};

const loadInitialKeys = (): Record<string, string> => {
  try {
    const gemini = localStorage.getItem("repolens_gemini_key") || "";
    const openai = localStorage.getItem("repolens_openai_key") || "";
    const anthropic = localStorage.getItem("repolens_anthropic_key") || "";
    return {
      ...(gemini ? { gemini } : {}),
      ...(openai ? { openai } : {}),
      ...(anthropic ? { anthropic } : {}),
    };
  } catch {
    return {};
  }
};

export const useRepoStore = create<RepoState>((set, get) => ({
  projectId: null,
  metadata: null,
  graph: null,
  isLoading: false,
  error: null,

  selectedNode: null,
  activeFilePath: null,
  activeFileContent: null,
  activeLineRange: null,
  isLoadingFile: false,

  selectedTypeFilter: null,
  selectedLayerId: null,
  searchFilter: "",

  activeProvider: "gemini",
  activeModel: "gemini-2.5-flash",
  byokKeys: loadInitialKeys(),
  availableModels: DEFAULT_MODELS,
  isFetchingModels: false,
  isApiKeyModalOpen: false,
  chatMessages: [],
  isChatLoading: false,

  auditReport: null,
  isAuditing: false,

  filesCache: new Map<string, string>(),
  chunksCache: [],

  openApiKeyModal: () => set({ isApiKeyModalOpen: true }),
  closeApiKeyModal: () => set({ isApiKeyModalOpen: false }),

  setProjectId: (id) => set({ projectId: id }),

  setProjectData: (id, graph, metadata, files, chunks) => {
    const filesMap = files || new Map<string, string>();
    const chunksArr = chunks || [];
    set({
      projectId: id,
      graph,
      metadata,
      filesCache: filesMap,
      chunksCache: chunksArr,
      isLoading: false,
      error: null,
    });

    // 1. Save metadata & graph to localStorage (small footprint, survives tab closes/refreshes)
    try {
      const summary = {
        id,
        name: metadata.name,
        owner: metadata.owner,
        repo: metadata.repo,
        commitSha: metadata.commitSha,
        metadata,
        graph,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(`repolens_meta_${id}`, JSON.stringify(summary));

      // Update recent projects list for ProjectsListPage
      const existingListJson = localStorage.getItem("repolens_recent_projects");
      const existingList = existingListJson ? JSON.parse(existingListJson) : [];
      const updatedList = [
        summary,
        ...existingList.filter((p: any) => p.id !== id),
      ].slice(0, 25);
      localStorage.setItem("repolens_recent_projects", JSON.stringify(updatedList));

      // Save exact repo URL for deterministic re-analysis if needed
      if (metadata.owner && metadata.repo) {
        localStorage.setItem(`repolens_repo_url_${id}`, `https://github.com/${metadata.owner}/${metadata.repo}`);
      }
    } catch (e) {
      console.warn("Could not write project to localStorage:", e);
    }

    // 2. Cache sample files in sessionStorage safely
    try {
      sessionStorage.setItem(
        `repolens_project_${id}`,
        JSON.stringify({
          graph,
          metadata,
          files: Array.from(filesMap.entries()).slice(0, 40),
          chunks: chunksArr.slice(0, 100),
        })
      );
    } catch {}

    const firstFile = graph.nodes.find((n) => n.type === "file");
    if (firstFile && firstFile.filePath) {
      get().loadFile(firstFile.filePath);
    }
    get().runAudit(id);
  },

  loadProject: async (id) => {
    // 1. If project data already in store, skip fetch
    const current = get();
    if (current.projectId === id && current.graph && current.metadata) {
      return;
    }

    // 2. Instant Demo Project support (zero network delay)
    if (id === "demo-express-react-app" || id === "demo") {
      const demo = getDemoProject();
      const filesMap = new Map<string, string>();
      for (const [path, file] of demo.files.entries()) {
        filesMap.set(path, file.content);
      }
      get().setProjectData(
        demo.id,
        demo.graph,
        demo.metadata,
        filesMap,
        demo.chunks
      );
      return;
    }

    // 3. Check sessionStorage cache
    try {
      const cached = sessionStorage.getItem(`repolens_project_${id}`);
      if (cached) {
        const { graph, metadata, files, chunks } = JSON.parse(cached);
        if (graph && metadata) {
          const filesMap = new Map<string, string>(files || []);
          set({
            projectId: id,
            graph,
            metadata,
            filesCache: filesMap,
            chunksCache: chunks || [],
            isLoading: false,
            error: null,
          });
          const firstFile = graph.nodes.find((n: any) => n.type === "file");
          if (firstFile && firstFile.filePath) {
            get().loadFile(firstFile.filePath);
          }
          get().runAudit(id);
          return;
        }
      }
    } catch {}

    // 4. Check localStorage meta cache
    try {
      const metaCached = localStorage.getItem(`repolens_meta_${id}`);
      if (metaCached) {
        const parsed = JSON.parse(metaCached);
        if (parsed.graph && parsed.metadata) {
          set({
            projectId: id,
            graph: parsed.graph,
            metadata: parsed.metadata,
            isLoading: false,
            error: null,
          });
          const firstFile = parsed.graph.nodes.find((n: any) => n.type === "file");
          if (firstFile && firstFile.filePath) {
            get().loadFile(firstFile.filePath);
          }
          get().runAudit(id);
          return;
        }
      }
    } catch {}

    // 5. Fallback to server API
    set({ isLoading: true, error: null, projectId: id });
    try {
      const data = await ApiClient.getGraph(id);
      set({
        graph: data.graph,
        metadata: data.metadata,
        isLoading: false,
      });

      const firstFile = data.graph.nodes.find((n) => n.type === "file");
      if (firstFile && firstFile.filePath) {
        get().loadFile(firstFile.filePath);
      }

      get().runAudit(id);
      return;
    } catch {
      // 6. On-demand client-side fallback
      let targetRepoUrl = localStorage.getItem(`repolens_repo_url_${id}`);
      if (!targetRepoUrl) {
        // Robust ID parsing: ${owner}-${repo}-${commitSha7}
        const lastDash = id.lastIndexOf("-");
        if (lastDash > 0) {
          const withoutSha = id.slice(0, lastDash);
          const firstDash = withoutSha.indexOf("-");
          if (firstDash > 0) {
            const owner = withoutSha.slice(0, firstDash);
            const repo = withoutSha.slice(firstDash + 1);
            targetRepoUrl = `https://github.com/${owner}/${repo}`;
          }
        }
      }

      if (targetRepoUrl) {
        try {
          const result = await ClientAnalyzer.analyze(targetRepoUrl, 50);
          get().setProjectData(
            result.projectId,
            result.graph,
            result.metadata,
            result.files,
            result.chunks
          );
          return;
        } catch (clientErr: any) {
          set({ error: clientErr.message || "Failed to load repository graph", isLoading: false });
          return;
        }
      }

      set({ error: "Repository project not found", isLoading: false });
    }
  },

  selectNode: (node) => {
    set({ selectedNode: node });
    if (node && node.filePath) {
      get().loadFile(node.filePath, node.lineRange);
    }
  },

  loadFile: async (path, lineRange) => {
    const { projectId, filesCache, metadata } = get();
    if (!projectId) return;

    set({ activeFilePath: path, activeLineRange: lineRange || null, isLoadingFile: true });

    // 1. Check local files cache first (0ms instant response)
    if (filesCache && filesCache.has(path)) {
      set({ activeFileContent: filesCache.get(path)!, isLoadingFile: false });
      return;
    }

    // 2. Try server API
    try {
      const fileData = await ApiClient.getFile(projectId, path);
      if (filesCache) filesCache.set(path, fileData.content);
      set({ activeFileContent: fileData.content, isLoadingFile: false });
      return;
    } catch {}

    // 3. Fallback to direct raw GitHub content fetch
    if (metadata && metadata.owner && metadata.repo) {
      try {
        const rawUrl = `https://raw.githubusercontent.com/${metadata.owner}/${metadata.repo}/${metadata.commitSha}/${path}`;
        const resp = await fetch(rawUrl);
        if (resp.ok) {
          const content = await resp.text();
          if (filesCache) filesCache.set(path, content);
          set({ activeFileContent: content, isLoadingFile: false });
          return;
        }
      } catch {}
    }

    set({ activeFileContent: "// Unable to load file content from repository.", isLoadingFile: false });
  },

  setTypeFilter: (type) => set({ selectedTypeFilter: type }),
  setLayerFilter: (layerId) => set({ selectedLayerId: layerId }),
  setSearchFilter: (query) => set({ searchFilter: query }),

  setProvider: (provider, model) => {
    const state = get();
    const models = state.availableModels[provider] || DEFAULT_MODELS[provider] || [];
    const chosenModel = model || (models.includes(state.activeModel) ? state.activeModel : models[0]);
    set({
      activeProvider: provider,
      activeModel: chosenModel || (provider === "gemini" ? "gemini-2.5-flash" : provider === "openai" ? "gpt-4o-mini" : "claude-3-5-sonnet"),
    });
    // Automatically trigger live model list refresh for this provider
    get().fetchModelsForProvider(provider);
  },

  setModel: (model) => set({ activeModel: model }),

  fetchModelsForProvider: async (provider, apiKey) => {
    const key = apiKey !== undefined ? apiKey : get().byokKeys[provider];
    const cleanKey = (key || "").trim();
    set({ isFetchingModels: true });

    // 1. Try server API (/api/settings/models)
    try {
      const data = await ApiClient.getModels(provider, cleanKey || undefined);
      if (data.models && data.models.length > 0) {
        set((state) => ({
          availableModels: {
            ...state.availableModels,
            [provider]: data.models,
          },
          activeModel: data.models.includes(state.activeModel) ? state.activeModel : data.models[0],
          isFetchingModels: false,
        }));
        return data.models;
      }
    } catch (e: any) {
      // 2. Direct client-side provider fallback if key is present
      if (cleanKey) {
        try {
          const directModels = await ClientModelFetcher.fetchDirect(provider, cleanKey);
          if (directModels && directModels.length > 0) {
            set((state) => ({
              availableModels: {
                ...state.availableModels,
                [provider]: directModels,
              },
              activeModel: directModels.includes(state.activeModel) ? state.activeModel : directModels[0],
              isFetchingModels: false,
            }));
            return directModels;
          }
        } catch (directErr: any) {
          console.warn("Direct model fetch error:", directErr);
          set({ isFetchingModels: false });
          throw new Error(directErr.message || e.message);
        }
      }

      console.warn("Could not fetch models for provider:", e);
      set({ isFetchingModels: false });
      if (cleanKey) {
        throw e;
      }
    }

    set({ isFetchingModels: false });
    return get().availableModels[provider] || DEFAULT_MODELS[provider] || [];
  },

  setByokKey: (provider, key) => {
    try {
      if (key.trim()) {
        localStorage.setItem(`repolens_${provider}_key`, key.trim());
      } else {
        localStorage.removeItem(`repolens_${provider}_key`);
      }
    } catch {}
    set((state) => ({
      byokKeys: { ...state.byokKeys, [provider]: key.trim() },
    }));
  },

  sendChatMessage: async (message) => {
    const { projectId, activeProvider, activeModel, byokKeys, chatMessages, chunksCache, graph } = get();
    if (!projectId) return;

    const userMsg: ChatMessageItem = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    set({
      chatMessages: [...chatMessages, userMsg],
      isChatLoading: true,
    });

    try {
      // Assemble retrieved context blocks client-side if chunks are in memory
      let contextBlocks: string[] | undefined;
      if (chunksCache && chunksCache.length > 0 && graph) {
        const retriever = new RepositoryRetriever(chunksCache, graph);
        const results = retriever.search(message, 6);
        contextBlocks = results.map(
          (r) => `--- File: ${r.chunk.filePath} (Lines ${r.chunk.startLine}-${r.chunk.endLine}) ---\n${r.chunk.content}\n`
        );
      }

      const res = await ApiClient.chat({
        projectId,
        message,
        provider: activeProvider,
        model: activeModel,
        apiKey: byokKeys[activeProvider],
        contextBlocks,
      });

      const assistantMsg: ChatMessageItem = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: res.answer,
        citations: res.citations,
        timestamp: new Date().toISOString(),
      };

      set((state) => ({
        chatMessages: [...state.chatMessages, assistantMsg],
        isChatLoading: false,
      }));
    } catch (err: any) {
      const msg = err.message || "Failed to get AI response.";
      if (msg.includes("API key is not configured") || msg.includes("API key is missing") || msg.includes("Gemini API key")) {
        get().openApiKeyModal();
      }

      const errorMsg: ChatMessageItem = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `⚠️ API Key Required: ${msg}\n\nPlease click "Configure API Key" in the top bar to enter your free Gemini API key (no server .env needed).`,
        timestamp: new Date().toISOString(),
      };

      set((state) => ({
        chatMessages: [...state.chatMessages, errorMsg],
        isChatLoading: false,
      }));
    }
  },

  clearChat: () => set({ chatMessages: [] }),

  runAudit: async (projectId, useAi = false) => {
    const id = projectId || get().projectId;
    if (!id) return null;

    set({ isAuditing: true });
    try {
      const { activeProvider, byokKeys, filesCache } = get();

      // 1. Try server audit first
      try {
        const report = await ApiClient.auditRepo(id, {
          useAi,
          provider: activeProvider,
          apiKey: byokKeys[activeProvider],
        });
        set({ auditReport: report, isAuditing: false });
        return report;
      } catch (serverErr) {
        // 2. Fallback: run deterministic audit client-side if files are cached
        if (filesCache && filesCache.size > 0) {
          const filesMap = new Map();
          for (const [path, content] of filesCache.entries()) {
            filesMap.set(path, { path, content, sizeBytes: content.length, sha: "" });
          }
          const report = RepoAuditor.auditFiles(id, filesMap);
          set({ auditReport: report, isAuditing: false });
          return report;
        }
        throw serverErr;
      }
    } catch (e) {
      console.error("Failed to run repository audit:", e);
      set({ isAuditing: false });
      return null;
    }
  },
}));
