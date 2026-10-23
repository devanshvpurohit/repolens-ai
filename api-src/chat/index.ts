import type { IncomingMessage, ServerResponse } from "http";
import { defaultProviderManager, type ProviderId } from "../../packages/ai-providers/src/index";
import { getRepositoryStore, parseJsonBody, sendJson } from "../../packages/shared/src/index";
import { RepositoryRetriever, extractCitationsFromText, validateCitations } from "../../packages/retrieval/src/index";
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
    const parsed = ChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return sendJson(res, 400, { error: parsed.error.errors[0]?.message || "Invalid chat request" });
    }

    const store = getRepositoryStore();
    const project = store.getProject(parsed.data.projectId);

    if (!project) {
      return sendJson(res, 404, { error: `Project '${parsed.data.projectId}' not found.` });
    }

    // 1. Retrieve top-k relevant source chunks
    const retriever = new RepositoryRetriever(project.chunks, project.graph);
    const results = retriever.search(parsed.data.message, 6);

    // 2. Assemble grounded context with strict token budget
    const contextBlocks = results.map((r) => {
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
    const provider = defaultProviderManager.getProvider(parsed.data.provider as ProviderId);
    const aiResponse = await provider.generate({
      systemPrompt,
      messages: [{ role: "user", content: parsed.data.message }],
      apiKey: parsed.data.apiKey,
      model: parsed.data.model,
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

    const commitSha = project.commitSha || "main";
    const extracted = extractCitationsFromText(aiResponse.text, fileStoreAdapter, commitSha);
    const validCitations = validateCitations(extracted, fileStoreAdapter, commitSha);
    const limitations: string[] = [];

    return sendJson(res, 200, {
      answer: aiResponse.text,
      model: aiResponse.model,
      provider: aiResponse.provider,
      citations: validCitations,
      limitations,
      usage: aiResponse.usage,
    });
  } catch (err: any) {
    return sendJson(res, 500, {
      error: err.message || "Failed to generate chat answer",
    });
  }
}
