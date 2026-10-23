import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { FileCode, FunctionSquare, Box, Globe, Shield, Database, Cpu } from "lucide-react";
import type { GraphNode } from "@repolens/graph-schema";

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: any; border: string; bg: string; text: string; badge: string }
> = {
  file: {
    label: "File",
    icon: FileCode,
    border: "border-blue-500/40 hover:border-blue-400",
    bg: "bg-blue-950/40",
    text: "text-blue-300",
    badge: "bg-blue-500/20 text-blue-300",
  },
  function: {
    label: "Function",
    icon: FunctionSquare,
    border: "border-cyan-500/40 hover:border-cyan-400",
    bg: "bg-cyan-950/40",
    text: "text-cyan-300",
    badge: "bg-cyan-500/20 text-cyan-300",
  },
  class: {
    label: "Class",
    icon: Box,
    border: "border-purple-500/40 hover:border-purple-400",
    bg: "bg-purple-950/40",
    text: "text-purple-300",
    badge: "bg-purple-500/20 text-purple-300",
  },
  endpoint: {
    label: "Endpoint",
    icon: Globe,
    border: "border-emerald-500/40 hover:border-emerald-400",
    bg: "bg-emerald-950/40",
    text: "text-emerald-300",
    badge: "bg-emerald-500/20 text-emerald-300",
  },
  service: {
    label: "Service",
    icon: Cpu,
    border: "border-amber-500/40 hover:border-amber-400",
    bg: "bg-amber-950/40",
    text: "text-amber-300",
    badge: "bg-amber-500/20 text-amber-300",
  },
  table: {
    label: "Database",
    icon: Database,
    border: "border-rose-500/40 hover:border-rose-400",
    bg: "bg-rose-950/40",
    text: "text-rose-300",
    badge: "bg-rose-500/20 text-rose-300",
  },
};

export const CustomNode = memo(({ data, selected }: any) => {
  const node = data.node as GraphNode;
  const config = TYPE_CONFIG[node.type] || TYPE_CONFIG.file;
  const Icon = config.icon;

  return (
    <div
      className={`relative px-3 py-2.5 rounded-xl border backdrop-blur-md transition-all duration-200 min-w-[180px] max-w-[260px] shadow-lg ${
        config.bg
      } ${selected ? "border-blue-400 ring-2 ring-blue-500/50 shadow-blue-500/20" : config.border}`}
    >
      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 bg-slate-400 border-2 border-slate-900" />

      <div className="flex items-center gap-2 mb-1.5">
        <div className={`p-1 rounded-md ${config.badge}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{config.label}</span>
        {node.complexity && (
          <span
            className={`ml-auto text-[9px] px-1.5 py-0.2 rounded font-mono ${
              node.complexity === "complex"
                ? "bg-rose-500/20 text-rose-300"
                : node.complexity === "moderate"
                ? "bg-amber-500/20 text-amber-300"
                : "bg-slate-700 text-slate-300"
            }`}
          >
            {node.complexity}
          </span>
        )}
      </div>

      <div className="font-semibold text-xs text-slate-100 truncate" title={node.name}>
        {node.name}
      </div>

      {node.filePath && (
        <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5" title={node.filePath}>
          {node.filePath}
        </div>
      )}

      {node.lineRange && (
        <div className="text-[9px] text-slate-500 font-mono mt-1">
          L{node.lineRange[0]} - L{node.lineRange[1]}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 bg-blue-400 border-2 border-slate-900" />
    </div>
  );
});

CustomNode.displayName = "CustomNode";
