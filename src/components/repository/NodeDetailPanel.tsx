import React from "react";
import { useRepoStore } from "@/stores/repo-store";
import {
  FileCode,
  FunctionSquare,
  Box,
  Globe,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export function NodeDetailPanel() {
  const { selectedNode, graph, loadFile, projectId, sendChatMessage } = useRepoStore();
  const navigate = useNavigate();

  if (!selectedNode) {
    return (
      <div className="w-80 h-full border-l border-slate-800 bg-slate-900/40 p-6 flex flex-col items-center justify-center text-center text-slate-500 text-xs">
        <Sparkles className="w-8 h-8 text-slate-700 mb-2" />
        <p>Click any node in the knowledge graph to view its architecture explanation, relationships, and code.</p>
      </div>
    );
  }

  // Incoming and Outgoing Edges
  const outgoingEdges = graph?.edges.filter((e) => e.source === selectedNode.id) || [];
  const incomingEdges = graph?.edges.filter((e) => e.target === selectedNode.id) || [];

  const handleAskAI = () => {
    if (!projectId) return;
    const prompt = `Explain the purpose and design of ${selectedNode.type} "${selectedNode.name}" located at ${selectedNode.filePath || "the root"} and how it interacts with other components.`;
    sendChatMessage(prompt);
    navigate(`/project/${projectId}/chat`);
  };

  return (
    <aside className="w-80 h-full border-l border-slate-800 bg-slate-900/40 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
            {selectedNode.type}
          </span>
          {selectedNode.complexity && (
            <span className="text-[10px] font-mono text-slate-400 ml-auto">
              {selectedNode.complexity} complexity
            </span>
          )}
        </div>
        <h2 className="text-base font-bold text-slate-100 break-words">{selectedNode.name}</h2>
        {selectedNode.filePath && (
          <div className="text-xs text-slate-400 font-mono mt-1 break-all flex items-center gap-1">
            <span>{selectedNode.filePath}</span>
            {selectedNode.lineRange && (
              <span className="text-blue-400 text-[11px]">
                :L{selectedNode.lineRange[0]}-L{selectedNode.lineRange[1]}
              </span>
            )}
          </div>
        )}
      </div>

      {/* AI Explanation */}
      <div className="p-4 border-b border-slate-800">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          Component Summary
        </div>
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
          {selectedNode.summary || "No automated summary generated for this node."}
        </p>

        {selectedNode.tags && selectedNode.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {selectedNode.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/50"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <button
          onClick={handleAskAI}
          className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors shadow-sm shadow-blue-600/30"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Ask AI About This Component
        </button>
      </div>

      {/* Relationships */}
      <div className="p-4 flex-1">
        {/* Outgoing */}
        <div className="mb-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
            Outgoing Calls & Dependencies ({outgoingEdges.length})
          </div>
          {outgoingEdges.length === 0 ? (
            <div className="text-[11px] text-slate-500 italic">No outgoing dependencies.</div>
          ) : (
            <div className="space-y-1.5">
              {outgoingEdges.map((e, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded bg-slate-950/40 border border-slate-800/60 text-xs flex flex-col gap-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-cyan-400 text-[10px] uppercase">{e.type}</span>
                    <span className="text-[9px] text-slate-500">wt: {e.weight}</span>
                  </div>
                  <span className="font-semibold text-slate-200 truncate">{e.target.split("#").pop()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Incoming */}
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
            Incoming References ({incomingEdges.length})
          </div>
          {incomingEdges.length === 0 ? (
            <div className="text-[11px] text-slate-500 italic">No incoming references.</div>
          ) : (
            <div className="space-y-1.5">
              {incomingEdges.map((e, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded bg-slate-950/40 border border-slate-800/60 text-xs flex flex-col gap-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-blue-400 text-[10px] uppercase">{e.type}</span>
                    <span className="text-[9px] text-slate-500">wt: {e.weight}</span>
                  </div>
                  <span className="font-semibold text-slate-200 truncate">{e.source.split("#").pop()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
