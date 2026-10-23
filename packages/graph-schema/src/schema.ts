import { z } from "zod";
import type { KnowledgeGraph, GraphNode, GraphEdge } from "./types";

export const NodeTypeSchema = z.enum([
  "file",
  "function",
  "class",
  "module",
  "concept",
  "config",
  "document",
  "service",
  "table",
  "endpoint",
  "pipeline",
  "schema",
  "resource",
]);

export const EdgeTypeSchema = z.enum([
  "imports",
  "exports",
  "contains",
  "inherits",
  "implements",
  "calls",
  "subscribes",
  "publishes",
  "reads_from",
  "writes_to",
  "depends_on",
  "tested_by",
  "configures",
  "routes",
  "deploys",
]);

export const GraphNodeSchema = z.object({
  id: z.string().min(1),
  type: NodeTypeSchema,
  name: z.string().min(1),
  filePath: z.string().optional(),
  lineRange: z.tuple([z.number(), z.number()]).optional(),
  summary: z.string().default(""),
  tags: z.array(z.string()).default([]),
  complexity: z.enum(["simple", "moderate", "complex"]).default("simple"),
  languageNotes: z.string().optional(),
});

export const GraphEdgeSchema = z.object({
  source: z.string().min(1),
  target: z.string().min(1),
  type: EdgeTypeSchema,
  direction: z.enum(["forward", "backward", "bidirectional"]).default("forward"),
  description: z.string().optional(),
  weight: z.number().min(0).max(1).default(0.5),
});

export const LayerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(""),
  nodeIds: z.array(z.string()),
});

export const TourStepSchema = z.object({
  order: z.number().int().nonnegative(),
  title: z.string().min(1),
  description: z.string().default(""),
  nodeIds: z.array(z.string()),
  languageLesson: z.string().optional(),
});

export const ProjectMetaSchema = z.object({
  name: z.string().min(1),
  owner: z.string().optional(),
  languages: z.array(z.string()).default([]),
  frameworks: z.array(z.string()).default([]),
  description: z.string().default(""),
  analyzedAt: z.string(),
  gitCommitHash: z.string(),
  totalFiles: z.number().optional(),
  totalNodes: z.number().optional(),
  totalEdges: z.number().optional(),
});

export const KnowledgeGraphSchema = z.object({
  version: z.string().default("1.0.0"),
  kind: z.literal("codebase").default("codebase"),
  project: ProjectMetaSchema,
  nodes: z.array(GraphNodeSchema),
  edges: z.array(GraphEdgeSchema),
  layers: z.array(LayerSchema).default([]),
  tour: z.array(TourStepSchema).default([]),
});

export interface ValidationIssue {
  path: string;
  message: string;
  code?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
}

export function validateGraph(data: unknown): ValidationResult {
  const result = KnowledgeGraphSchema.safeParse(data);
  if (result.success) {
    const nodeIds = new Set(result.data.nodes.map((n) => n.id));
    const danglingEdgeErrors: ValidationIssue[] = [];

    for (const [idx, edge] of result.data.edges.entries()) {
      if (!nodeIds.has(edge.source)) {
        danglingEdgeErrors.push({
          path: `edges[${idx}].source`,
          message: `Source node '${edge.source}' does not exist in graph nodes.`,
        });
      }
      if (!nodeIds.has(edge.target)) {
        danglingEdgeErrors.push({
          path: `edges[${idx}].target`,
          message: `Target node '${edge.target}' does not exist in graph nodes.`,
        });
      }
    }

    if (danglingEdgeErrors.length > 0) {
      return { valid: false, errors: danglingEdgeErrors };
    }

    return { valid: true, errors: [] };
  }

  return {
    valid: false,
    errors: result.error.errors.map((e) => ({
      path: e.path.join("."),
      message: e.message,
      code: e.code,
    })),
  };
}

export function autoFixGraph(graph: KnowledgeGraph): KnowledgeGraph {
  // Deduplicate nodes
  const nodeMap = new Map<string, GraphNode>();
  for (const node of graph.nodes) {
    if (!nodeMap.has(node.id)) {
      nodeMap.set(node.id, node);
    }
  }

  const validNodeIds = new Set(nodeMap.keys());

  // Filter out dangling edges and deduplicate
  const edgeMap = new Map<string, GraphEdge>();
  for (const edge of graph.edges) {
    if (validNodeIds.has(edge.source) && validNodeIds.has(edge.target)) {
      const key = `${edge.source}->${edge.target}:${edge.type}`;
      if (!edgeMap.has(key)) {
        edgeMap.set(key, edge);
      }
    }
  }

  // Filter layers to existing node IDs
  const layers = (graph.layers || []).map((layer) => ({
    ...layer,
    nodeIds: layer.nodeIds.filter((id) => validNodeIds.has(id)),
  }));

  // Filter tour steps to existing node IDs
  const tour = (graph.tour || []).map((step) => ({
    ...step,
    nodeIds: step.nodeIds.filter((id) => validNodeIds.has(id)),
  }));

  const fixedNodes = Array.from(nodeMap.values());
  const fixedEdges = Array.from(edgeMap.values());

  return {
    ...graph,
    nodes: fixedNodes,
    edges: fixedEdges,
    layers,
    tour,
    project: {
      ...graph.project,
      totalNodes: fixedNodes.length,
      totalEdges: fixedEdges.length,
    },
  };
}
