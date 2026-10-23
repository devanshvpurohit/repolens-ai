import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useRepoStore } from "@/stores/repo-store";
import { Sidebar } from "@/components/repository/Sidebar";
import { KnowledgeGraphView } from "@/components/graph/KnowledgeGraphView";
import { NodeDetailPanel } from "@/components/repository/NodeDetailPanel";
import { MonacoViewer } from "@/components/source-viewer/MonacoViewer";
import {
  Network,
  Code2,
  MessageSquare,
  Loader2,
  AlertCircle,
  Sparkles,
  Maximize2,
} from "lucide-react";

export function ProjectDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const { loadProject, isLoading, error, graph, metadata } = useRepoStore();

  const [activeCenterTab, setActiveCenterTab] = useState<"graph" | "split" | "code">("graph");

  useEffect(() => {
    if (id) {
      loadProject(id);
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center bg-slate-950 text-slate-400 text-sm">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
        <p>Loading repository knowledge graph...</p>
      </div>
    );
  }

  if (error || !graph) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
        <h2 className="text-base font-semibold text-slate-200 mb-1">Failed to load repository</h2>
        <p className="text-xs text-slate-400 mb-4 max-w-md">{error || "Graph not found."}</p>
        <Link
          to="/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors"
        >
          Analyze Another Repository
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-slate-950 overflow-hidden">
      {/* Sub-header with View Modes and Chat Jump */}
      <div className="h-10 border-b border-slate-800 bg-slate-900/40 px-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveCenterTab("graph")}
            className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
              activeCenterTab === "graph"
                ? "bg-slate-800 text-blue-400 font-medium"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            Knowledge Graph
          </button>
          <button
            onClick={() => setActiveCenterTab("split")}
            className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
              activeCenterTab === "split"
                ? "bg-slate-800 text-blue-400 font-medium"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Split View (Graph + Code)
          </button>
          <button
            onClick={() => setActiveCenterTab("code")}
            className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
              activeCenterTab === "code"
                ? "bg-slate-800 text-blue-400 font-medium"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Source Editor
          </button>
        </div>

        <Link
          to={`/project/${id}/chat`}
          className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-600/30"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Repository Chat</span>
        </Link>
      </div>

      {/* 3-Panel Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Center Panel (Graph / Code / Split) */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-950 relative">
          {activeCenterTab === "graph" && (
            <div className="w-full h-full">
              <KnowledgeGraphView />
            </div>
          )}

          {activeCenterTab === "code" && (
            <div className="w-full h-full">
              <MonacoViewer />
            </div>
          )}

          {activeCenterTab === "split" && (
            <div className="w-full h-full flex flex-col md:flex-row">
              <div className="flex-1 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-slate-800">
                <KnowledgeGraphView />
              </div>
              <div className="flex-1 h-1/2 md:h-full">
                <MonacoViewer />
              </div>
            </div>
          )}
        </main>

        {/* Right Detail Panel */}
        <NodeDetailPanel />
      </div>
    </div>
  );
}
