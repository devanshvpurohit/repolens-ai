import type { FileAnalysisResult } from "@repolens/analysis-adapter";

export interface SourceChunk {
  id: string;
  filePath: string;
  startLine: number;
  endLine: number;
  content: string;
  symbolName?: string;
  symbolKind?: string;
  commitSha: string;
}

export function chunkSourceFile(
  filePath: string,
  content: string,
  commitSha: string,
  analysis?: FileAnalysisResult
): SourceChunk[] {
  const lines = content.split("\n");
  const chunks: SourceChunk[] = [];

  // If we have extracted symbols, create chunks aligned with functions and classes
  if (analysis && analysis.symbols.length > 0) {
    for (const sym of analysis.symbols) {
      const [start, end] = sym.lineRange;
      const snippetLines = lines.slice(start - 1, end);
      const snippet = snippetLines.join("\n");

      chunks.push({
        id: `${filePath}#${sym.name}:${start}-${end}`,
        filePath,
        startLine: start,
        endLine: Math.min(end, lines.length),
        content: snippet,
        symbolName: sym.name,
        symbolKind: sym.kind,
        commitSha,
      });
    }
  }

  // Also include sliding window chunks for complete coverage
  const windowSize = 60;
  const stride = 40;

  for (let i = 0; i < lines.length; i += stride) {
    const startLine = i + 1;
    const endLine = Math.min(i + windowSize, lines.length);
    const snippet = lines.slice(i, endLine).join("\n");

    chunks.push({
      id: `${filePath}:${startLine}-${endLine}`,
      filePath,
      startLine,
      endLine,
      content: snippet,
      commitSha,
    });

    if (endLine >= lines.length) break;
  }

  return chunks;
}
