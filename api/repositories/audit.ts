import type { IncomingMessage, ServerResponse } from "http";
import { getRepositoryStore, sendJson, parseJsonBody } from "@repolens/shared";
import { RepoAuditor, type AuditReport } from "@repolens/analysis-adapter";
import { defaultProviderManager, type ProviderId } from "@repolens/ai-providers";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method === "OPTIONS") {
    return sendJson(res, 200, { ok: true });
  }

  let projectId: string | null = null;
  let useAi = false;
  let providerId: ProviderId = "gemini";
  let apiKey: string | undefined;

  if (req.method === "GET") {
    const url = new URL(req.url || "/", "http://localhost");
    projectId = url.searchParams.get("id");
  } else if (req.method === "POST") {
    try {
      const body = await parseJsonBody(req);
      projectId = body.projectId || body.id;
      useAi = Boolean(body.useAi);
      if (body.provider) providerId = body.provider;
      apiKey = body.apiKey;
    } catch {
      return sendJson(res, 400, { error: "Invalid JSON body" });
    }
  } else {
    return sendJson(res, 405, { error: "Method not allowed. Use GET or POST." });
  }

  if (!projectId) {
    return sendJson(res, 400, { error: "Missing required 'id' parameter." });
  }

  const store = getRepositoryStore();
  const project = store.getProject(projectId);

  if (!project) {
    return sendJson(res, 404, { error: `Project '${projectId}' not found.` });
  }

  // Run deterministic static audit on ingested files
  const report: AuditReport = RepoAuditor.auditFiles(projectId, project.files);

  // If AI enhancement is requested and AI provider is accessible, summarize findings
  if (useAi) {
    try {
      const provider = defaultProviderManager.getProvider(providerId);
      const topItems = report.items.slice(0, 10);
      const sampleFiles = Array.from(project.files.keys()).slice(0, 15).join(", ");
      const prompt = `You are a Principal Software Architect and Security Auditor inspecting repository ${project.owner}/${project.repo}.
The repository contains ${project.files.size} files (${sampleFiles}...).
Static analysis discovered ${report.summary.totalIssues} potential items (Health Score: ${report.summary.codeHealthScore}/100, Grade: ${report.summary.healthGrade}):
Issues:
${JSON.stringify(topItems, null, 2)}

Provide:
1. Executive Summary (2-3 sentences evaluating readiness for production).
2. Architectural & State Management observations.
3. Top 3-4 prioritized action items for the engineering team.
Format clearly in Markdown.`;

      const aiResponse = await provider.generate({
        messages: [{ role: "user", content: prompt }],
        apiKey,
        maxOutputTokens: 500,
      });
      report.aiExecutiveSummary = aiResponse.text;
    } catch (e: any) {
      console.warn("Could not enrich audit report with AI summary:", e.message);
    }
  }

  return sendJson(res, 200, report);
}
