import React, { useState, useMemo } from "react";
import { useRepoStore } from "@/stores/repo-store";
import { Folder, FolderOpen, FileCode, ChevronRight, ChevronDown } from "lucide-react";

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children?: TreeNode[];
}

function buildFileTree(paths: string[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const path of paths) {
    const parts = path.split("/");
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFolder = i < parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join("/");

      let existing = currentLevel.find((node) => node.name === part);
      if (!existing) {
        existing = {
          name: part,
          path: currentPath,
          isFolder,
          children: isFolder ? [] : undefined,
        };
        currentLevel.push(existing);
      }
      if (isFolder && existing.children) {
        currentLevel = existing.children;
      }
    }
  }

  // Sort: folders first, then alphabetically
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    });
    for (const node of nodes) {
      if (node.children) sortNodes(node.children);
    }
  };

  sortNodes(root);
  return root;
}

export function FileExplorer() {
  const { graph, activeFilePath, loadFile } = useRepoStore();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const filePaths = useMemo(() => {
    if (!graph) return [];
    return graph.nodes
      .filter((n) => n.type === "file" && n.filePath)
      .map((n) => n.filePath!);
  }, [graph]);

  const tree = useMemo(() => buildFileTree(filePaths), [filePaths]);

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  };

  const renderNode = (node: TreeNode, depth = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = activeFilePath === node.path;

    if (node.isFolder) {
      return (
        <div key={node.path}>
          <button
            onClick={() => toggleFolder(node.path)}
            className="w-full flex items-center gap-1.5 px-2 py-1 text-left text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 rounded transition-colors group"
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span className="truncate">{node.name}</span>
          </button>
          {isExpanded && node.children && (
            <div>{node.children.map((child) => renderNode(child, depth + 1))}</div>
          )}
        </div>
      );
    }

    return (
      <button
        key={node.path}
        onClick={() => loadFile(node.path)}
        className={`w-full flex items-center gap-1.5 px-2 py-1 text-left text-xs rounded transition-colors ${
          isSelected
            ? "bg-blue-600/20 text-blue-300 font-medium border-l-2 border-blue-500"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
        }`}
        style={{ paddingLeft: `${depth * 12 + 20}px` }}
      >
        <FileCode className="w-3.5 h-3.5 text-slate-400" />
        <span className="truncate">{node.name}</span>
      </button>
    );
  };

  return (
    <div className="py-1">
      {tree.length === 0 ? (
        <div className="text-xs text-slate-500 px-3 py-2">No source files available.</div>
      ) : (
        tree.map((node) => renderNode(node))
      )}
    </div>
  );
}
