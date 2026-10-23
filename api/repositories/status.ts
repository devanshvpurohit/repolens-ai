import type { IncomingMessage, ServerResponse } from "http";
import { getRepositoryStore, sendJson } from "@repolens/shared";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method not allowed. Use GET." });
  }

  const url = new URL(req.url || "/", "http://localhost");
  const jobId = url.searchParams.get("jobId");

  if (!jobId) {
    return sendJson(res, 400, { error: "Query parameter 'jobId' is required." });
  }

  const store = getRepositoryStore();
  const job = store.getJob(jobId);

  if (!job) {
    return sendJson(res, 404, { error: `Job '${jobId}' not found.` });
  }

  return sendJson(res, 200, {
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    currentStage: job.currentStage,
    totalFiles: job.totalFiles,
    processedFiles: job.processedFiles,
    errorMessage: job.errorMessage,
    updatedAt: job.updatedAt,
  });
}
