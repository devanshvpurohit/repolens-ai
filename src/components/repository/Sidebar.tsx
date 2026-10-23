import React from "react";
import { useRepoStore } from "@/stores/repo-store";
import { FileExplorer } from "./FileExplorer";
import {
  GitCommit,
  Star,
  GitFork,
  Search,
  Filter,
  Layers,
  FileCode,
  FunctionSquare,
  Box,
  Globe,
} from "lucide-react";

export function Sidebar() {
  const {
    metadata,
    graph,
    selectedTypeFilter,
    setTypeFilter,
    selectedLayerId,
    setLayerFilter,
    searchFilter,
    setSearchFilter,
  } = useRepoStore();

  const nodeTypes = [
    { id: null, label: "All", icon: Filter },
    { id: "file", label: "Files", icon: FileCode },
    { id: "function", label: "Functions", icon: FunctionSquare },
    { id: "class", label: "Classes", icon: Box },
    { id: "endpoint", label: "Endpoints", icon: Globe },
  ];

  return (
    <aside className="w-80 h-full border-r border-slate-800 bg-slate-900/40 flex flex-col overflow-hidden">
      {/* Repo Metadata Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold text-slate-100 truncate">
            {metadata ? `${metadata.owner}/${metadata.repo}` : "Repository Explorer"}
          </div>
        </div>

        {metadata && (
          <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1 font-mono text-[11px] bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/50">
              <GitCommit className="w-3 h-3 text-blue-400" />
              {metadata.commitSha ? metadata.commitSha.slice(0, 7) : metadata.defaultBranch}
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400" />
              {metadata.stars}
            </span>
            <span className="flex items-center gap-1">
              <GitFork className="w-3 h-3 text-slate-400" />
              {metadata.forks}
            </span>
            {metadata.primaryLanguage && (
              <span className="text-[11px] text-blue-400 font-medium">
                {metadata.primaryLanguage}
              </span>
            )}
          </div>
        )}

        {/* Search Input */}
        <div className="mt-3 relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search nodes & files..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-3 py-2 border-b border-slate-800 flex items-center gap-1 overflow-x-auto text-xs">
        {nodeTypes.map((item) => {
          const Icon = item.icon;
          const isSelected = selectedTypeFilter === item.id;
          return (
            <button
              key={item.label}
              onClick={() => setTypeFilter(item.id)}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 whitespace-nowrap ${
                isSelected
                  ? "bg-blue-600 text-white font-medium"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Icon className="w-3 h-3" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Architecture Layers Accordion */}
      {graph && graph.layers.length > 0 && (
        <div className="border-b border-slate-800 p-3">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-blue-400" />
            Architecture Layers
          </div>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setLayerFilter(null)}
              className={`text-left text-xs px-2.5 py-1 rounded transition-colors flex items-center justify-between ${
                selectedLayerId === null
                  ? "bg-slate-800 text-blue-300 font-medium"
                  : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
              }`}
            >
              <span>All Layers</span>
              <span className="text-[10px] text-slate-500 font-mono">{graph.nodes.length}</span>
            </button>
            {graph.layers.map((layer) => (
              <button
                key={layer.id}
                onClick={() => setLayerFilter(layer.id)}
                className={`text-left text-xs px-2.5 py-1 rounded transition-colors flex items-center justify-between ${
                  selectedLayerId === layer.id
                    ? "bg-blue-600/20 text-blue-300 font-medium border-l-2 border-blue-500"
                    : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                }`}
              >
                <span className="truncate">{layer.name}</span>
                <span className="text-[10px] text-slate-500 font-mono ml-1">{layer.nodeIds.length}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* File Explorer Tree Header & Tree */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 pt-3 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Source Files</span>
          {graph && (
            <span className="text-[10px] font-mono text-slate-500">
              {graph.nodes.filter((n) => n.type === "file").length} files
            </span>
          )}
        </div>
        <FileExplorer />
      </div>
    </aside>
  );
}
