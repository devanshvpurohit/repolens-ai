import type { IncomingMessage, ServerResponse } from "http";
import { defaultProviderManager, type ProviderId } from "@repolens/ai-providers";
import { getRepositoryStore } from "@repolens/shared";
import { RepositoryRetriever, extractCitationsFromText, validateCitations } from "@repolens/retrieval";
import { parseJsonBody, sendJson } from "@repolens/shared";
import { z } from "zod";

const ChatRequestSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  message: z.string().min(1, "Message cannot be empty"),
  provider: z.enum(["gemini", "openai", "anthropic", "ollama"]).default("gemini"),
  model: z.string().optional(),
  apiKey: z.string().optional(),
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
    const parsed = ChatRequestSchema.parse(body);

    const store = getRepositoryStore();
    const project = store.getProject(parsed.projectId);

    if (!project) {
      return sendJson(res, 404, { error: `Project '${parsed.projectId}' not found.` });
    }

    // 1. Retrieve top-k relevant source chunks
    const retriever = new RepositoryRetriever(project.chunks, project.graph);
    const results = retriever.search(parsed.message, 6);

    // 2. Assemble grounded context with strict token budget
    const contextBlocks = results.map((r, idx) => {
      return `--- File: ${r.chunk.filePath} (Lines ${r.chunk.startLine}-${r.chunk.endLine}) ---\n${r.chunk.content}\n`;
    });

    const systemPrompt = `You are RepoLens AI, an expert software architecture assistant.
You are answering questions about the repository "${project.name}" (commit ${project.commitSha.slice(0, 7)}).

STRICT INSTRUCTIONS:
1. Base your answer EXCLUSIVELY on the retrieved source code context below.
2. If the answer cannot be established from the provided code, state clearly what is unknown.
3. Every time you refer to a specific file or symbol, include exact line citations in the format: [path/to/file:startLine-endLine], for example: [src/App.tsx:4-16].
4. Never invent filenames or line numbers that do not appear in the context.

SOURCE CODE CONTEXT:
${contextBlocks.join("\n\n")}`;

    // 3. Call AI Provider
    const provider = defaultProviderManager.getProvider(parsed.provider as ProviderId);
    const aiResponse = await provider.generate({
      systemPrompt,
      messages: [{ role: "user", content: parsed.message }],
      apiKey: parsed.apiKey,
      model: parsed.model,
      temperature: 0.2,
      maxOutputTokens: 1500,
    });

    // 4. Validate citations against actual repository files
    const fileStoreAdapter = {
      getFile: (path: string) => {
        const file = project.files.get(path);
        if (!file) return undefined;
        return { lineCount: file.content.split("\n").length };
      },
    };

    const extractedCitations = extractCitationsFromText(
      aiResponse.text,
      fileStoreAdapter,
      project.commitSha
    );

    // Also include the top retrieved chunks as citations if none extracted directly
    if (extractedCitations.length === 0 && results.length > 0) {
      for (const r of results.slice(0, 3)) {
        extractedCitations.push({
          path: r.chunk.filePath,
          startLine: r.chunk.startLine,
          endLine: r.chunk.endLine,
          commitSha: project.commitSha,
        });
      }
    }

    const verifiedCitations = validateCitations(
      extractedCitations,
      fileStoreAdapter,
      project.commitSha
    );

    return sendJson(res, 200, {
      answer: aiResponse.text,
      model: aiResponse.model,
      provider: aiResponse.provider,
      citations: verifiedCitations,
      usage: aiResponse.usage,
      limitations: [
        "Static analysis cannot establish dynamic runtime behavior (e.g. database query results, environment secrets, or external API responses).",
      ],
    });
  } catch (err: any) {
    return sendJson(res, 500, {
      error: err.message || "Failed to process chat query",
    });
  }
}
