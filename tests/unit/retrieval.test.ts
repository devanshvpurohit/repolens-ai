import { describe, it, expect } from "vitest";
import {
  chunkSourceFile,
  RepositoryRetriever,
  validateCitations,
  extractCitationsFromText,
} from "@repolens/retrieval";

describe("Retrieval - Chunking & Search", () => {
  const sampleCode = `
export function login(user: string) {
  // authentication logic
  return user;
}

export function logout() {
  // cleanup session
}
`;

  it("chunks source files with line numbers", () => {
    const chunks = chunkSourceFile("src/auth.ts", sampleCode, "sha123");
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].filePath).toBe("src/auth.ts");
    expect(chunks[0].startLine).toBeGreaterThan(0);
    expect(chunks[0].commitSha).toBe("sha123");
  });

  it("retrieves chunks matching query terms", () => {
    const chunks = chunkSourceFile("src/auth.ts", sampleCode, "sha123");
    const retriever = new RepositoryRetriever(chunks);
    const results = retriever.search("login authentication");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].chunk.content).toContain("login");
  });
});

describe("Retrieval - Citation Validation", () => {
  const fileStore = {
    getFile: (path: string) => {
      if (path === "src/auth.ts") return { lineCount: 50 };
      if (path === "src/index.ts") return { lineCount: 30 };
      return undefined;
    },
  };

  it("extracts citations from model text", () => {
    const modelText = "The authentication is handled in [src/auth.ts:1-15] and called by `src/index.ts:5-10`.";
    const citations = extractCitationsFromText(modelText, fileStore, "sha123");
    expect(citations).toHaveLength(2);
    expect(citations[0].path).toBe("src/auth.ts");
    expect(citations[0].startLine).toBe(1);
    expect(citations[0].endLine).toBe(15);
  });

  it("filters out fabricated files and clamps invalid line numbers", () => {
    const rawCitations = [
      { path: "non/existent.ts", startLine: 10, endLine: 20, commitSha: "sha123" },
      { path: "src/auth.ts", startLine: -5, endLine: 9999, commitSha: "sha123" },
    ];

    const valid = validateCitations(rawCitations, fileStore, "sha123");
    expect(valid).toHaveLength(1);
    expect(valid[0].path).toBe("src/auth.ts");
    expect(valid[0].startLine).toBe(1);
    expect(valid[0].endLine).toBe(50); // Clamped to actual file lineCount
  });
});
