import { describe, it, expect } from "vitest";
import { validateGraph, autoFixGraph, type KnowledgeGraph } from "@repolens/graph-schema";

describe("Graph Schema - Validation & AutoFix", () => {
  const validGraph: KnowledgeGraph = {
    version: "1.0.0",
    kind: "codebase",
    project: {
      name: "Test Project",
      languages: ["TypeScript"],
      frameworks: [],
      description: "Test description",
      analyzedAt: new Date().toISOString(),
      gitCommitHash: "abcdef1234567890",
    },
    nodes: [
      {
        id: "file:src/index.ts",
        type: "file",
        name: "index.ts",
        filePath: "src/index.ts",
        summary: "Entry file",
        tags: ["typescript"],
        complexity: "simple",
      },
      {
        id: "function:src/index.ts#main",
        type: "function",
        name: "main",
        filePath: "src/index.ts",
        summary: "Main entry point",
        tags: ["function"],
        complexity: "simple",
      },
    ],
    edges: [
      {
        source: "file:src/index.ts",
        target: "function:src/index.ts#main",
        type: "contains",
        direction: "forward",
        weight: 1.0,
      },
    ],
    layers: [
      {
        id: "layer-api",
        name: "API Layer",
        description: "API routes",
        nodeIds: ["file:src/index.ts"],
      },
    ],
    tour: [
      {
        order: 1,
        title: "Overview",
        description: "Tour step 1",
        nodeIds: ["file:src/index.ts"],
      },
    ],
  };

  it("validates a healthy graph successfully", () => {
    const res = validateGraph(validGraph);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it("detects dangling edge endpoints", () => {
    const brokenGraph: KnowledgeGraph = {
      ...validGraph,
      edges: [
        {
          source: "file:src/index.ts",
          target: "non-existent-target",
          type: "contains",
          direction: "forward",
          weight: 0.5,
        },
      ],
    };

    const res = validateGraph(brokenGraph);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.message.includes("does not exist"))).toBe(true);
  });

  it("autoFixGraph removes dangling edges and deduplicates nodes", () => {
    const dirtyGraph: KnowledgeGraph = {
      ...validGraph,
      nodes: [
        validGraph.nodes[0],
        validGraph.nodes[0], // Duplicate
        validGraph.nodes[1],
      ],
      edges: [
        validGraph.edges[0],
        {
          source: "file:src/index.ts",
          target: "dangling-id",
          type: "calls",
          direction: "forward",
          weight: 0.5,
        },
      ],
    };

    const fixed = autoFixGraph(dirtyGraph);
    expect(fixed.nodes).toHaveLength(2);
    expect(fixed.edges).toHaveLength(1);
    expect(validateGraph(fixed).valid).toBe(true);
  });
});
