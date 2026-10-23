import type { SourceChunk } from "./chunker.js";
import type { KnowledgeGraph } from "@repolens/graph-schema";

export interface RetrievalResult {
  chunk: SourceChunk;
  score: number;
  reason: string;
}

export class RepositoryRetriever {
  private readonly chunks: SourceChunk[] = [];
  private readonly graph?: KnowledgeGraph;

  constructor(chunks: SourceChunk[], graph?: KnowledgeGraph) {
    this.chunks = chunks;
    this.graph = graph;
  }

  search(query: string, limit = 6): RetrievalResult[] {
    const rawTokens = query.toLowerCase().split(/[^a-zA-Z0-9_]+/).filter((t) => t.length > 2);
    if (rawTokens.length === 0) {
      return this.chunks.slice(0, limit).map((chunk) => ({
        chunk,
        score: 0.1,
        reason: "default fallback",
      }));
    }

    const scored: RetrievalResult[] = [];

    for (const chunk of this.chunks) {
      let score = 0;
      const lowerContent = chunk.content.toLowerCase();
      const lowerPath = chunk.filePath.toLowerCase();
      const lowerSym = (chunk.symbolName || "").toLowerCase();

      for (const token of rawTokens) {
        // Direct symbol match (highest weight)
        if (lowerSym === token) {
          score += 10;
        } else if (lowerSym.includes(token)) {
          score += 5;
        }

        // File path match
        if (lowerPath.includes(token)) {
          score += 4;
        }

        // Content match
        if (lowerContent.includes(token)) {
          score += 1;
        }
      }

      if (score > 0) {
        scored.push({
          chunk,
          score,
          reason: `keyword match (score: ${score})`,
        });
      }
    }

    scored.sort((a, b) => b.score - a.score);

    // Expand graph neighbors if we have a knowledge graph
    if (this.graph && scored.length > 0) {
      const topSymbols = scored
        .filter((s) => s.chunk.symbolName)
        .slice(0, 3)
        .map((s) => s.chunk.symbolName!);

      const relatedFiles = new Set<string>();

      for (const edge of this.graph.edges) {
        for (const sym of topSymbols) {
          if (edge.source.includes(sym)) {
            // Find target file
            const targetNode = this.graph.nodes.find((n) => n.id === edge.target);
            if (targetNode?.filePath) relatedFiles.add(targetNode.filePath);
          }
          if (edge.target.includes(sym)) {
            const sourceNode = this.graph.nodes.find((n) => n.id === edge.source);
            if (sourceNode?.filePath) relatedFiles.add(sourceNode.filePath);
          }
        }
      }

      // Add neighbor chunks if not already included
      for (const relPath of relatedFiles) {
        const neighborChunk = this.chunks.find((c) => c.filePath === relPath);
        if (neighborChunk && !scored.some((s) => s.chunk.id === neighborChunk.id)) {
          scored.push({
            chunk: neighborChunk,
            score: 3.0,
            reason: "graph neighbor expansion",
          });
        }
      }
    }

    return scored.slice(0, limit);
  }
}
