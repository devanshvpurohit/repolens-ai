export type NodeType =
  | "file"
  | "function"
  | "class"
  | "module"
  | "concept"
  | "config"
  | "document"
  | "service"
  | "table"
  | "endpoint"
  | "pipeline"
  | "schema"
  | "resource";

export type EdgeType =
  | "imports"
  | "exports"
  | "contains"
  | "inherits"
  | "implements"
  | "calls"
  | "subscribes"
  | "publishes"
  | "reads_from"
  | "writes_to"
  | "depends_on"
  | "tested_by"
  | "configures"
  | "routes"
  | "deploys";

export interface GraphNode {
  id: string;
  type: NodeType;
  name: string;
  filePath?: string;
  lineRange?: [number, number];
  summary: string;
  tags: string[];
  complexity: "simple" | "moderate" | "complex";
  languageNotes?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: EdgeType;
  direction: "forward" | "backward" | "bidirectional";
  description?: string;
  weight: number;
}

export interface Layer {
  id: string;
  name: string;
  description: string;
  nodeIds: string[];
}

export interface TourStep {
  order: number;
  title: string;
  description: string;
  nodeIds: string[];
  languageLesson?: string;
}

export interface ProjectMeta {
  name: string;
  owner?: string;
  languages: string[];
  frameworks: string[];
  description: string;
  analyzedAt: string;
  gitCommitHash: string;
  totalFiles?: number;
  totalNodes?: number;
  totalEdges?: number;
}

export interface KnowledgeGraph {
  version: string;
  kind?: "codebase";
  project: ProjectMeta;
  nodes: GraphNode[];
  edges: GraphEdge[];
  layers: Layer[];
  tour: TourStep[];
}

export interface SourceCitation {
  path: string;
  startLine: number;
  endLine: number;
  commitSha: string;
  snippet?: string;
}

export interface RepositoryAnswer {
  answer: string;
  citations: SourceCitation[];
  limitations?: string[];
  suggestedFollowUps?: string[];
}
