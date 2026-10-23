import { create } from "zustand";
import type { KnowledgeGraph, GraphNode } from "@repolens/graph-schema";
import type { RepoMetadata } from "@repolens/github-ingestion";
import type { AuditReport, AuditItem } from "@repolens/analysis-adapter";
import { ApiClient } from "@/lib/api-client";

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

  // Actions
  setProjectId: (id: string) => void;
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

  openApiKeyModal: () => set({ isApiKeyModalOpen: true }),
  closeApiKeyModal: () => set({ isApiKeyModalOpen: false }),

  setProjectId: (id) => set({ projectId: id }),

  loadProject: async (id) => {
    set({ isLoading: true, error: null, projectId: id });
    try {
      const data = await ApiClient.getGraph(id);
      set({
        graph: data.graph,
        metadata: data.metadata,
        isLoading: false,
      });

      // Default select the first file if available
      const firstFile = data.graph.nodes.find((n) => n.type === "file");
      if (firstFile && firstFile.filePath) {
        get().loadFile(firstFile.filePath);
      }

      // Automatically run repository code audit in background
      get().runAudit(id);
    } catch (err: any) {
      set({ error: err.message || "Failed to load repository graph", isLoading: false });
    }
  },

  selectNode: (node) => {
    set({ selectedNode: node });
    if (node && node.filePath) {
      get().loadFile(node.filePath, node.lineRange);
    }
  },

  loadFile: async (path, lineRange) => {
    const { projectId } = get();
    if (!projectId) return;

    set({ activeFilePath: path, activeLineRange: lineRange || null, isLoadingFile: true });
    try {
      const fileData = await ApiClient.getFile(projectId, path);
      set({ activeFileContent: fileData.content, isLoadingFile: false });
    } catch {
      set({ activeFileContent: "// Unable to load file content.", isLoadingFile: false });
    }
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
    set({ isFetchingModels: true });
    try {
      const data = await ApiClient.getModels(provider, key || undefined);
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
      console.warn("Could not fetch models for provider:", e);
      set({ isFetchingModels: false });
      if (apiKey) {
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
    const { projectId, activeProvider, activeModel, byokKeys, chatMessages } = get();
    if (!projectId) return;

    // If activeProvider is not ollama and no key is provided, prompt the modal immediately
    if (activeProvider !== "ollama" && !byokKeys[activeProvider]) {
      // First check if there is an env key or if we should prompt
      get().openApiKeyModal();
    }

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
      const res = await ApiClient.chat({
        projectId,
        message,
        provider: activeProvider,
        model: activeModel,
        apiKey: byokKeys[activeProvider],
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
      const { activeProvider, byokKeys } = get();
      const report = await ApiClient.auditRepo(id, {
        useAi,
        provider: activeProvider,
        apiKey: byokKeys[activeProvider],
      });
      set({ auditReport: report, isAuditing: false });
      return report;
    } catch (e) {
      console.error("Failed to run repository audit:", e);
      set({ isAuditing: false });
      return null;
    }
  },
}));
