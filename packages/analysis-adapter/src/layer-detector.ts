import type { Layer } from "@repolens/graph-schema";

export function detectArchitectureLayers(
  filePaths: string[],
  nodeIdToPath: Map<string, string>
): Layer[] {
  const uiNodeIds: string[] = [];
  const apiNodeIds: string[] = [];
  const serviceNodeIds: string[] = [];
  const dataNodeIds: string[] = [];
  const infraNodeIds: string[] = [];

  for (const [nodeId, path] of nodeIdToPath.entries()) {
    const lower = path.toLowerCase();

    // UI / Presentation
    if (
      lower.includes("components/") ||
      lower.includes("pages/") ||
      lower.includes("views/") ||
      lower.includes("app/") ||
      lower.includes("styles/") ||
      lower.endsWith(".tsx") ||
      lower.endsWith(".jsx") ||
      lower.endsWith(".vue") ||
      lower.endsWith(".svelte") ||
      lower.endsWith(".css") ||
      lower.endsWith(".html")
    ) {
      uiNodeIds.push(nodeId);
      continue;
    }

    // API / Routing
    if (
      lower.includes("api/") ||
      lower.includes("routes/") ||
      lower.includes("controllers/") ||
      lower.includes("endpoints/") ||
      lower.includes("handlers/") ||
      lower.includes("middleware/")
    ) {
      apiNodeIds.push(nodeId);
      continue;
    }

    // Data / Storage
    if (
      lower.includes("models/") ||
      lower.includes("entities/") ||
      lower.includes("schemas/") ||
      lower.includes("db/") ||
      lower.includes("database/") ||
      lower.includes("migrations/") ||
      lower.includes("repositories/") ||
      lower.endsWith(".sql") ||
      lower.endsWith(".prisma")
    ) {
      dataNodeIds.push(nodeId);
      continue;
    }

    // Infrastructure / Config
    if (
      lower.includes("config/") ||
      lower.includes("scripts/") ||
      lower.includes(".github/") ||
      lower.includes("docker") ||
      lower.endsWith(".json") ||
      lower.endsWith(".yaml") ||
      lower.endsWith(".yml") ||
      lower.endsWith(".toml") ||
      lower.endsWith(".sh")
    ) {
      infraNodeIds.push(nodeId);
      continue;
    }

    // Default to Business Logic / Services
    serviceNodeIds.push(nodeId);
  }

  const layers: Layer[] = [];

  if (uiNodeIds.length > 0) {
    layers.push({
      id: "layer-ui",
      name: "Frontend & Presentation",
      description: "User interfaces, pages, client components, and layouts.",
      nodeIds: uiNodeIds,
    });
  }

  if (apiNodeIds.length > 0) {
    layers.push({
      id: "layer-api",
      name: "API & Routing",
      description: "HTTP handlers, controllers, API routes, and network gateways.",
      nodeIds: apiNodeIds,
    });
  }

  if (serviceNodeIds.length > 0) {
    layers.push({
      id: "layer-services",
      name: "Business Logic & Services",
      description: "Core application services, domain models, logic, and helpers.",
      nodeIds: serviceNodeIds,
    });
  }

  if (dataNodeIds.length > 0) {
    layers.push({
      id: "layer-data",
      name: "Data & Storage",
      description: "Data schemas, database models, entities, and migrations.",
      nodeIds: dataNodeIds,
    });
  }

  if (infraNodeIds.length > 0) {
    layers.push({
      id: "layer-infra",
      name: "Infrastructure & Config",
      description: "Build tools, deployment configurations, scripts, and runtime settings.",
      nodeIds: infraNodeIds,
    });
  }

  return layers;
}
