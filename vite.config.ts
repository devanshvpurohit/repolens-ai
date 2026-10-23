import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Load local environment files if present
try {
  process.loadEnvFile(".env.local");
} catch {}
try {
  process.loadEnvFile(".env");
} catch {}

// Local dev middleware mapping /api/* to handlers
function apiDevServerPlugin() {
  return {
    name: "api-dev-server",
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url ? new URL(req.url, "http://localhost").pathname : "";

        if (!url.startsWith("/api/")) {
          return next();
        }

        try {
          let routeFile = "";
          if (url === "/api/health") {
            routeFile = "./api/health.ts";
          } else if (url === "/api/repositories/inspect") {
            routeFile = "./api/repositories/inspect.ts";
          } else if (url === "/api/repositories/analyze") {
            routeFile = "./api/repositories/analyze.ts";
          } else if (url === "/api/repositories/status") {
            routeFile = "./api/repositories/status.ts";
          } else if (url === "/api/repositories/graph") {
            routeFile = "./api/repositories/graph.ts";
          } else if (url === "/api/repositories/files") {
            routeFile = "./api/repositories/files.ts";
          } else if (url === "/api/repositories/audit") {
            routeFile = "./api/repositories/audit.ts";
          } else if (url === "/api/repositories/search") {
            routeFile = "./api/repositories/search.ts";
          } else if (url === "/api/chat" || url === "/api/chat/stream") {
            routeFile = "./api/chat/index.ts";
          } else if (url === "/api/settings/providers" || url === "/api/settings/providers/test") {
            routeFile = "./api/settings/providers.ts";
          } else if (url === "/api/settings/models") {
            routeFile = "./api/settings/models.ts";
          } else {
            res.statusCode = 404;
            return res.end(JSON.stringify({ error: `API route '${url}' not found` }));
          }

          const handlerModule = await server.ssrLoadModule(routeFile);
          if (handlerModule && handlerModule.default) {
            await handlerModule.default(req, res);
          } else {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Handler missing default export" }));
          }
        } catch (err: any) {
          console.error("API dev server error:", err);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: err.message || "Internal server error" }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), apiDevServerPlugin()],
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
  server: {
    port: 3000,
  },
});
