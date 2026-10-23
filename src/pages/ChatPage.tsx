import React, { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useRepoStore } from "@/stores/repo-store";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { MonacoViewer } from "@/components/source-viewer/MonacoViewer";
import { ArrowLeft, Network, FileCode } from "lucide-react";

export function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const { loadProject, projectId, metadata } = useRepoStore();

  useEffect(() => {
    if (id && (!projectId || projectId !== id)) {
      loadProject(id);
    }
  }, [id, projectId]);

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-slate-950 overflow-hidden">
      {/* Subheader */}
      <div className="h-10 border-b border-slate-800 bg-slate-900/60 px-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <Link
            to={`/project/${id}`}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Knowledge Graph</span>
          </Link>
          <span className="text-slate-600">|</span>
          <span className="font-semibold text-slate-200 truncate">
            {metadata ? `${metadata.owner}/${metadata.repo}` : "Repository Chat"}
          </span>
        </div>

        <Link
          to={`/project/${id}`}
          className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1"
        >
          <Network className="w-3.5 h-3.5 text-blue-400" />
          <span>View Graph</span>
        </Link>
      </div>

      {/* Split Chat & Code View */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left: Chat interface */}
        <div className="flex-1 md:w-1/2 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-slate-800">
          <ChatPanel />
        </div>

        {/* Right: Monaco Editor synced with citations */}
        <div className="flex-1 md:w-1/2 h-1/2 md:h-full">
          <MonacoViewer />
        </div>
      </div>
    </div>
  );
}
