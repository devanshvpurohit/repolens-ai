import { create } from "zustand";
import type { KnowledgeGraph, GraphNode } from "@repolens/graph-schema";
import type { RepoMetadata } from "@repolens/github-ingestion";
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
  chatMessages: ChatMessageItem[];
  isChatLoading: boolean;

  // Actions
  setProjectId: (id: string) => void;
  loadProject: (id: string) => Promise<void>;
  selectNode: (node: GraphNode | null) => void;
  loadFile: (path: string, lineRange?: [number, number]) => Promise<void>;
  setTypeFilter: (type: string | null) => void;
  setLayerFilter: (layerId: string | null) => void;
  setSearchFilter: (query: string) => void;
  setProvider: (provider: string, model?: string) => void;
  setByokKey: (provider: string, key: string) => void;
  sendChatMessage: (message: string) => Promise<void>;
  clearChat: () => void;
}

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
  byokKeys: {},
  chatMessages: [],
  isChatLoading: false,

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

  setProvider: (provider, model) =>
    set({
      activeProvider: provider,
      activeModel: model || (provider === "gemini" ? "gemini-2.5-flash" : provider === "openai" ? "gpt-4o-mini" : "claude-3-5-sonnet"),
    }),

  setByokKey: (provider, key) =>
    set((state) => ({
      byokKeys: { ...state.byokKeys, [provider]: key },
    })),

  sendChatMessage: async (message) => {
    const { projectId, activeProvider, activeModel, byokKeys, chatMessages } = get();
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
      const errorMsg: ChatMessageItem = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `Error: ${err.message || "Failed to get AI response."}`,
        timestamp: new Date().toISOString(),
      };

      set((state) => ({
        chatMessages: [...state.chatMessages, errorMsg],
        isChatLoading: false,
      }));
    }
  },

  clearChat: () => set({ chatMessages: [] }),
}));
