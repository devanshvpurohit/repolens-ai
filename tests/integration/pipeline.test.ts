import { describe, it, expect } from "vitest";
import { buildKnowledgeGraph } from "@repolens/analysis-adapter";
import { validateGraph } from "@repolens/graph-schema";
import { chunkSourceFile, RepositoryRetriever } from "@repolens/retrieval";
import { getRepositoryStore } from "@repolens/shared";

describe("Integration - End-to-End Analysis Pipeline", () => {
  const sampleFiles = [
    {
      path: "src/index.ts",
      content: `
import { startServer } from "./server";
startServer();
`,
    },
    {
      path: "src/server.ts",
      content: `
import express from "express";
import { authRouter } from "./routes/auth";

export function startServer() {
  const app = express();
  app.use("/auth", authRouter);
  return app;
}
`,
    },
    {
      path: "src/routes/auth.ts",
      content: `
import { Router } from "express";

export const authRouter = Router();
authRouter.post("/login", (req, res) => {
  res.json({ token: "test" });
});
`,
    },
  ];

  it("builds a validated knowledge graph linking files, functions, and endpoints", () => {
    const graph = buildKnowledgeGraph({
      projectMeta: {
        name: "Pipeline Test",
        languages: ["TypeScript"],
        frameworks: ["Express"],
        description: "Integration test pipeline",
        analyzedAt: new Date().toISOString(),
        gitCommitHash: "0123456789abcdef",
      },
      files: sampleFiles,
    });

    const validation = validateGraph(graph);
    expect(validation.valid).toBe(true);

    // Verify nodes
    expect(graph.nodes.some((n) => n.id === "file:src/index.ts")).toBe(true);
    expect(graph.nodes.some((n) => n.name === "startServer")).toBe(true);
    expect(graph.nodes.some((n) => n.name.includes("POST /login"))).toBe(true);

    // Verify layers
    expect(graph.layers.length).toBeGreaterThan(0);
    expect(graph.layers.some((l) => l.name.includes("API"))).toBe(true);
  });

  it("indexes source chunks and supports keyword retrieval with graph neighbors", () => {
    const graph = buildKnowledgeGraph({
      projectMeta: {
        name: "Pipeline Test",
        languages: ["TypeScript"],
        frameworks: ["Express"],
        description: "Integration test pipeline",
        analyzedAt: new Date().toISOString(),
        gitCommitHash: "0123456789abcdef",
      },
      files: sampleFiles,
    });

    const chunks = sampleFiles.flatMap((f) => chunkSourceFile(f.path, f.content, "0123456789abcdef"));
    const retriever = new RepositoryRetriever(chunks, graph);

    const results = retriever.search("login auth");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].chunk.filePath).toBe("src/routes/auth.ts");
  });
});
