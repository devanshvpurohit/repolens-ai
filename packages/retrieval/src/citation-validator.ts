import type { SourceCitation } from "@repolens/graph-schema";

export interface FileMetadataStore {
  getFile(path: string): { lineCount: number } | undefined;
}

export function validateCitations(
  citations: SourceCitation[],
  fileStore: FileMetadataStore,
  expectedCommitSha: string
): SourceCitation[] {
  const valid: SourceCitation[] = [];

  for (const c of citations) {
    const file = fileStore.getFile(c.path);
    if (!file) {
      // Non-existent file cited, skip
      continue;
    }

    // Ensure positive integers and start <= end
    const startLine = Math.max(1, Math.floor(c.startLine || 1));
    const maxLine = file.lineCount || 10000;
    const endLine = Math.min(maxLine, Math.max(startLine, Math.floor(c.endLine || startLine)));

    valid.push({
      path: c.path,
      startLine,
      endLine,
      commitSha: expectedCommitSha,
      snippet: c.snippet,
    });
  }

  return valid;
}

export function extractCitationsFromText(
  text: string,
  fileStore: FileMetadataStore,
  commitSha: string
): SourceCitation[] {
  const citations: SourceCitation[] = [];
  const seen = new Set<string>();

  // Look for patterns like:
  // [path/to/file.ts#L10-L20] or `path/to/file.ts:10-20` or path/to/file.ts (lines 10-20)
  const regex = /(?:`|\[|\()?([a-zA-Z0-9_./-]+\.[a-zA-Z0-9]+)(?:#L|:|\s*(?:lines?\s*))(\d+)(?:-(\d+))?(?:`|\]|\))?/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const path = match[1];
    const startLine = parseInt(match[2], 10);
    const endLine = match[3] ? parseInt(match[3], 10) : startLine;

    const file = fileStore.getFile(path);
    if (file && !seen.has(`${path}:${startLine}-${endLine}`)) {
      seen.add(`${path}:${startLine}-${endLine}`);
      citations.push({
        path,
        startLine,
        endLine: Math.min(file.lineCount, Math.max(startLine, endLine)),
        commitSha,
      });
    }
  }

  return citations;
}
