import type {
  KnowledgeGraph,
  GraphNode,
  GraphEdge,
  ProjectMeta,
  TourStep,
} from "@repolens/graph-schema";
import { autoFixGraph, validateGraph } from "@repolens/graph-schema";
import { extractSymbolsFromContent, type FileAnalysisResult } from "./ast-extractor.js";
import { detectLanguage } from "./language-detector.js";
import { detectArchitectureLayers } from "./layer-detector.js";

export interface BuildGraphOptions {
  projectMeta: ProjectMeta;
  files: Array<{ path: string; content: string }>;
}

export function buildKnowledgeGraph({ projectMeta, files }: BuildGraphOptions): KnowledgeGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeIdToPath = new Map<string, string>();
  const pathToNodeId = new Map<string, string>();

  const languagesSet = new Set<string>();

  // 1. Create File Nodes & Parse Symbols
  const analyzedFiles: FileAnalysisResult[] = [];

  for (const file of files) {
    const langInfo = detectLanguage(file.path);
    languagesSet.add(langInfo.name);

    const fileNodeId = `file:${file.path}`;
    pathToNodeId.set(file.path, fileNodeId);
    nodeIdToPath.set(fileNodeId, file.path);

    const basename = file.path.split("/").pop() || file.path;

    nodes.push({
      id: fileNodeId,
      type: "file",
      name: basename,
      filePath: file.path,
      lineRange: [1, Math.max(1, file.content.split("\n").length)],
      summary: `${langInfo.name} source file located at ${file.path}.`,
      tags: [langInfo.id, langInfo.category],
      complexity: file.content.length > 10000 ? "complex" : file.content.length > 2000 ? "moderate" : "simple",
    });

    const analysis = extractSymbolsFromContent(file.path, file.content);
    analyzedFiles.push(analysis);

    // Create symbol nodes (functions, classes, interfaces, endpoints)
    for (const sym of analysis.symbols) {
      const symNodeId = `${sym.kind}:${file.path}#${sym.name}`;
      nodeIdToPath.set(symNodeId, file.path);

      nodes.push({
        id: symNodeId,
        type: sym.kind === "endpoint" ? "endpoint" : sym.kind === "class" ? "class" : "function",
        name: sym.name,
        filePath: file.path,
        lineRange: sym.lineRange,
        summary: sym.signature || `${sym.kind} defined in ${basename}`,
        tags: [sym.kind, langInfo.id],
        complexity: "moderate",
      });

      // Edge: File contains symbol
      edges.push({
        source: fileNodeId,
        target: symNodeId,
        type: "contains",
        direction: "forward",
        weight: 0.8,
      });
    }
  }

  // 2. Resolve Import Dependencies Between Files
  for (const analysis of analyzedFiles) {
    const sourceFileNodeId = pathToNodeId.get(analysis.filePath);
    if (!sourceFileNodeId) continue;

    for (const imp of analysis.imports) {
      // Find matching target file
      for (const targetPath of pathToNodeId.keys()) {
        if (targetPath === analysis.filePath) continue;

        // Match relative or direct path
        const cleanImport = imp.source.replace(/^\.\//, "").replace(/^\.\.\//, "").replace(/\.(js|ts|jsx|tsx)$/, "");
        const cleanTarget = targetPath.replace(/\.(js|ts|jsx|tsx)$/, "");

        if (cleanTarget.endsWith(cleanImport) || targetPath.includes(cleanImport)) {
          const targetFileNodeId = pathToNodeId.get(targetPath)!;
          edges.push({
            source: sourceFileNodeId,
            target: targetFileNodeId,
            type: "imports",
            direction: "forward",
            description: imp.specifiers.length > 0 ? `imports ${imp.specifiers.slice(0, 3).join(", ")}` : "imports module",
            weight: 0.6,
          });
          break;
        }
      }
    }
  }

  // 3. Detect Architecture Layers
  const layers = detectArchitectureLayers(
    files.map((f) => f.path),
    nodeIdToPath
  );

  // 4. Generate Heuristic Tour Steps
  const tour: TourStep[] = [
    {
      order: 1,
      title: "Project Architecture & Overview",
      description: `Welcome to ${projectMeta.name}! This project contains ${files.length} analyzed files across ${Array.from(languagesSet).slice(0, 3).join(", ")}. Explore the top-level layers to understand the system design.`,
      nodeIds: nodes.filter((n) => n.type === "file").slice(0, 5).map((n) => n.id),
    },
    {
      order: 2,
      title: "Core Entry Points & Services",
      description: "Key services and primary application logic modules that orchestrate functionality.",
      nodeIds: nodes.filter((n) => n.type === "function" || n.type === "endpoint").slice(0, 5).map((n) => n.id),
    },
  ];

  const rawGraph: KnowledgeGraph = {
    version: "1.0.0",
    kind: "codebase",
    project: {
      ...projectMeta,
      languages: Array.from(languagesSet),
      totalFiles: files.length,
      totalNodes: nodes.length,
      totalEdges: edges.length,
    },
    nodes,
    edges,
    layers,
    tour,
  };

  const fixed = autoFixGraph(rawGraph);
  const validation = validateGraph(fixed);
  if (!validation.valid) {
    console.warn("Graph validation warnings:", validation.errors);
  }

  return fixed;
}
