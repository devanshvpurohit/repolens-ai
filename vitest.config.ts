import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@repolens/graph-schema": path.resolve(__dirname, "./packages/graph-schema/src/index.ts"),
      "@repolens/github-ingestion": path.resolve(__dirname, "./packages/github-ingestion/src/index.ts"),
      "@repolens/analysis-adapter": path.resolve(__dirname, "./packages/analysis-adapter/src/index.ts"),
      "@repolens/ai-providers": path.resolve(__dirname, "./packages/ai-providers/src/index.ts"),
      "@repolens/retrieval": path.resolve(__dirname, "./packages/retrieval/src/index.ts"),
      "@repolens/shared": path.resolve(__dirname, "./packages/shared/src/index.ts"),
    },
  },
});
