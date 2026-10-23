import type { IncomingMessage, ServerResponse } from "http";
import { GitHubClient, parseGitHubUrl } from "@repolens/github-ingestion";
import { parseJsonBody, sendJson } from "@repolens/shared";
import { z } from "zod";

const InspectSchema = z.object({
  repoUrl: z.string().min(1, "Repository URL is required"),
});

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method === "OPTIONS") {
    return sendJson(res, 200, { ok: true });
  }
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed. Use POST." });
  }

  try {
    const body = await parseJsonBody(req);
    const parsed = InspectSchema.safeParse(body);
    if (!parsed.success) {
      return sendJson(res, 400, { error: parsed.error.errors[0]?.message || "Invalid repository URL" });
    }

    const client = new GitHubClient();
    const meta = await client.resolveRepository(parsed.data.repoUrl);
    const tree = await client.fetchFilteredTree(meta, { maxFiles: 500 });

    return sendJson(res, 200, {
      metadata: meta,
      totalEligibleFiles: tree.length,
      filePreview: tree.slice(0, 50).map((t) => t.path),
    });
  } catch (err: any) {
    return sendJson(res, 400, {
      error: err.message || "Failed to inspect repository",
    });
  }
}
