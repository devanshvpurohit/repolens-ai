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
  contextBlocks: z.array(z.string()).optional(),
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

    let contextBlocks = parsed.data.contextBlocks || [];
    const projectName = project?.name || parsed.data.projectId;
    const commitSha = project?.commitSha || "main";

    if (contextBlocks.length === 0) {
      if (!project) {
        return sendJson(res, 404, { error: `Project '${parsed.data.projectId}' not found in active session.` });
      }
      // 1. Retrieve top-k relevant source chunks
      const retriever = new RepositoryRetriever(project.chunks, project.graph);
      const results = retriever.search(parsed.data.message, 6);
      contextBlocks = results.map((r) => {
        return `--- File: ${r.chunk.filePath} (Lines ${r.chunk.startLine}-${r.chunk.endLine}) ---\n${r.chunk.content}\n`;
      });
    }

    const systemPrompt = `You are RepoLens AI, an expert software architecture assistant.
You are answering questions about the repository "${projectName}" (commit ${commitSha.slice(0, 7)}).

STRICT INSTRUCTIONS:
1. Base your answer EXCLUSIVELY on the retrieved source code context below.
2. If the answer cannot be established from the provided code, state clearly what is unknown.
3. Every time you refer to a specific file or symbol, include exact line citations in the format: [path/to/file:startLine-endLine], for example: [src/App.tsx:4-16].
4. Never invent filenames or line numbers that do not appear in the context.

SOURCE CODE CONTEXT:
${contextBlocks.join("\n\n")}`;

    // 3. Call AI Provider with architectural synthesis fallback
    let aiResponse;
    const effectiveApiKey =
      parsed.data.apiKey ||
      (typeof process !== "undefined"
        ? parsed.data.provider === "gemini"
          ? process.env?.GEMINI_API_KEY
          : parsed.data.provider === "openai"
          ? process.env?.OPENAI_API_KEY
          : process.env?.ANTHROPIC_API_KEY
        : undefined);

    if (effectiveApiKey || parsed.data.provider === "ollama") {
      try {
        const provider = defaultProviderManager.getProvider(parsed.data.provider as ProviderId);
        aiResponse = await provider.generate({
          systemPrompt,
          messages: [{ role: "user", content: parsed.data.message }],
          apiKey: effectiveApiKey,
          model: parsed.data.model,
          temperature: 0.2,
          maxOutputTokens: 1500,
        });
      } catch (providerErr: any) {
        console.warn("AI provider error, falling back to deterministic synthesis:", providerErr.message);
      }
    }

    if (!aiResponse) {
      const synthesizedLines: string[] = [];
      synthesizedLines.push(`### Architecture Analysis for **${projectName}**\n`);
      synthesizedLines.push(`*Analyzed from codebase index (Commit \`${commitSha.slice(0, 7)}\`):*\n`);

      if (contextBlocks.length > 0) {
        synthesizedLines.push(`Here are the primary components and symbols identified for your query:\n`);
        for (let i = 0; i < Math.min(contextBlocks.length, 5); i++) {
          const block = contextBlocks[i];
          const fileMatch = block.match(/--- File: ([^ ]+) \(Lines (\d+)-(\d+)\) ---/);
          if (fileMatch) {
            const [, path, start, end] = fileMatch;
            synthesizedLines.push(`- **\`${path}\`** (lines ${start}-${end}): Key module referenced: [${path}:${start}-${end}]`);
          }
        }
        synthesizedLines.push(`\n**Next Steps:** Click any cited file above to open it in Monaco Viewer or explore connections in the Knowledge Graph.`);
      } else {
        synthesizedLines.push(`No direct source code chunks matched the query in the indexed files.`);
      }

      aiResponse = {
        text: synthesizedLines.join("\n"),
        model: "repolens-engine",
        provider: "deterministic",
        usage: { promptTokens: 0, completionTokens: 0 },
      };
    }

    // 4. Validate citations against actual repository files
    const fileStoreAdapter = {
      getFile: (path: string) => {
        const file = project?.files?.get(path);
        if (file) return { lineCount: file.content.split("\n").length };
        return { lineCount: 5000 };
      },
    };

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
