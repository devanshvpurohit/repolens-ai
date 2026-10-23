import esbuild from "esbuild";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const routes = [
  "health.ts",
  "chat/index.ts",
  "settings/models.ts",
  "settings/providers.ts",
  "repositories/analyze.ts",
  "repositories/audit.ts",
  "repositories/files.ts",
  "repositories/graph.ts",
  "repositories/inspect.ts",
  "repositories/search.ts",
  "repositories/status.ts",
];

async function bundleAll() {
  console.log("Bundling API routes with esbuild into self-contained serverless functions...");
  
  for (const route of routes) {
    const inPath = path.join(rootDir, "api-src", route);
    const outPath = path.join(rootDir, "api", route.replace(/\.ts$/, ".js"));
    
    fs.mkdirSync(path.dirname(outPath), { recursive: true });

    await esbuild.build({
      entryPoints: [inPath],
      outfile: outPath,
      bundle: true,
      platform: "node",
      target: "node20",
      format: "esm",
      external: ["pg"], // native driver optionally loaded
      sourcemap: false,
      minify: false,
    });

    console.log(`✓ Bundled ${route} -> api/${route.replace(/\.ts$/, ".js")}`);
  }
  
  console.log("All API routes successfully bundled into api/");
}

bundleAll().catch((err) => {
  console.error("Failed to bundle API routes:", err);
  process.exit(1);
});
