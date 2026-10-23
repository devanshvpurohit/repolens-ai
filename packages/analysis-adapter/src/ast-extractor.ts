export interface ExtractedSymbol {
  name: string;
  kind: "function" | "class" | "interface" | "endpoint" | "variable";
  lineRange: [number, number];
  signature?: string;
  summary?: string;
}

export interface ExtractedImport {
  source: string;
  specifiers: string[];
  line: number;
}

export interface FileAnalysisResult {
  filePath: string;
  language: string;
  lineCount: number;
  symbols: ExtractedSymbol[];
  imports: ExtractedImport[];
  exports: string[];
}

export function extractSymbolsFromContent(filePath: string, content: string): FileAnalysisResult {
  const lines = content.split("\n");
  const lineCount = lines.length;
  const symbols: ExtractedSymbol[] = [];
  const imports: ExtractedImport[] = [];
  const exports: string[] = [];

  const ext = filePath.split(".").pop()?.toLowerCase() || "";

  // 1. TypeScript / JavaScript / JSX
  if (["ts", "tsx", "js", "jsx", "mjs", "cjs"].includes(ext)) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNum = i + 1;

      // Imports: import { a, b } from './module'; or import foo from 'bar';
      const importMatch = line.match(/^import\s+(?:(?:\*\s+as\s+\w+)|(?:\{([^}]+)\})|([a-zA-Z0-9_$]+))\s+from\s+['"]([^'"]+)['"]/);
      if (importMatch) {
        const specifiersStr = importMatch[1] || importMatch[2] || "";
        const source = importMatch[3];
        const specifiers = specifiersStr.split(",").map((s) => s.trim()).filter(Boolean);
        imports.push({ source, specifiers, line: lineNum });
        continue;
      }

      // Exports: export function foo / export class Bar / export const baz
      if (line.startsWith("export ")) {
        const exportMatch = line.match(/^export\s+(?:default\s+)?(?:async\s+)?(?:function\*?\s+([a-zA-Z0-9_$]+)|class\s+([a-zA-Z0-9_$]+)|interface\s+([a-zA-Z0-9_$]+)|const\s+([a-zA-Z0-9_$]+)|let\s+([a-zA-Z0-9_$]+))/);
        if (exportMatch) {
          const name = exportMatch[1] || exportMatch[2] || exportMatch[3] || exportMatch[4] || exportMatch[5];
          if (name) exports.push(name);
        }
      }

      // Functions: function foo(...) or const foo = (...) => or async function
      const fnMatch = line.match(/(?:export\s+)?(?:default\s+)?(?:async\s+)?function\*?\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)/);
      if (fnMatch) {
        const name = fnMatch[1];
        symbols.push({
          name,
          kind: "function",
          lineRange: [lineNum, Math.min(lineNum + 20, lineCount)],
          signature: `function ${name}(${fnMatch[2]})`,
        });
        continue;
      }

      // Arrow functions: const foo = (...) => or const foo = async (...) =>
      const arrowMatch = line.match(/(?:export\s+)?const\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*(?::\s*[^=]+)?=>/);
      if (arrowMatch) {
        const name = arrowMatch[1];
        symbols.push({
          name,
          kind: "function",
          lineRange: [lineNum, Math.min(lineNum + 25, lineCount)],
          signature: `const ${name} = (${arrowMatch[2]}) =>`,
        });
        continue;
      }

      // Classes & Interfaces
      const classMatch = line.match(/(?:export\s+)?(?:default\s+)?(?:abstract\s+)?class\s+([a-zA-Z0-9_$]+)(?:\s+extends\s+[a-zA-Z0-9_$]+)?/);
      if (classMatch) {
        symbols.push({
          name: classMatch[1],
          kind: "class",
          lineRange: [lineNum, Math.min(lineNum + 40, lineCount)],
        });
        continue;
      }

      const ifaceMatch = line.match(/(?:export\s+)?interface\s+([a-zA-Z0-9_$]+)/);
      if (ifaceMatch) {
        symbols.push({
          name: ifaceMatch[1],
          kind: "interface",
          lineRange: [lineNum, Math.min(lineNum + 15, lineCount)],
        });
        continue;
      }

      // API Endpoints: app.get('/...', router.post('/...', etc.
      const endpointMatch = line.match(/(?:app|router)\.(get|post|put|delete|patch)\(\s*['"]([^'"]+)['"]/i);
      if (endpointMatch) {
        symbols.push({
          name: `${endpointMatch[1].toUpperCase()} ${endpointMatch[2]}`,
          kind: "endpoint",
          lineRange: [lineNum, Math.min(lineNum + 15, lineCount)],
        });
      }
    }
    return { filePath, language: "typescript", lineCount, symbols, imports, exports };
  }

  // 2. Python
  if (ext === "py") {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNum = i + 1;

      // Imports: from x import y or import x
      const pyImportMatch = line.match(/^(?:from\s+([a-zA-Z0-9_.]+)\s+import\s+([^#\n]+)|import\s+([a-zA-Z0-9_.]+))/);
      if (pyImportMatch) {
        const source = pyImportMatch[1] || pyImportMatch[3];
        const specifiers = (pyImportMatch[2] || "").split(",").map((s) => s.trim()).filter(Boolean);
        imports.push({ source, specifiers, line: lineNum });
        continue;
      }

      // Functions: def foo(...): or async def foo(...):
      const defMatch = line.match(/^(?:async\s+)?def\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/);
      if (defMatch) {
        symbols.push({
          name: defMatch[1],
          kind: "function",
          lineRange: [lineNum, Math.min(lineNum + 20, lineCount)],
          signature: `def ${defMatch[1]}(${defMatch[2]})`,
        });
        continue;
      }

      // Classes: class Bar(...):
      const classMatch = line.match(/^class\s+([a-zA-Z0-9_]+)(?:\(([^)]*)\))?:/);
      if (classMatch) {
        symbols.push({
          name: classMatch[1],
          kind: "class",
          lineRange: [lineNum, Math.min(lineNum + 40, lineCount)],
        });
        continue;
      }

      // FastAPI / Flask endpoints: @app.get('/...'), @router.post('/...')
      const epMatch = line.match(/@(?:app|router)\.(get|post|put|delete|patch)\(\s*['"]([^'"]+)['"]/i);
      if (epMatch) {
        symbols.push({
          name: `${epMatch[1].toUpperCase()} ${epMatch[2]}`,
          kind: "endpoint",
          lineRange: [lineNum, Math.min(lineNum + 15, lineCount)],
        });
      }
    }
    return { filePath, language: "python", lineCount, symbols, imports, exports };
  }

  // 3. Go
  if (ext === "go") {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNum = i + 1;

      // Functions: func Foo(...) or func (r *Receiver) Bar(...)
      const fnMatch = line.match(/^func\s+(?:\([^)]+\)\s+)?([a-zA-Z0-9_]+)\s*\(([^)]*)\)/);
      if (fnMatch) {
        symbols.push({
          name: fnMatch[1],
          kind: "function",
          lineRange: [lineNum, Math.min(lineNum + 25, lineCount)],
          signature: `func ${fnMatch[1]}(${fnMatch[2]})`,
        });
        continue;
      }

      // Structs / Interfaces: type Foo struct or type Bar interface
      const typeMatch = line.match(/^type\s+([a-zA-Z0-9_]+)\s+(struct|interface)/);
      if (typeMatch) {
        symbols.push({
          name: typeMatch[1],
          kind: typeMatch[2] === "struct" ? "class" : "interface",
          lineRange: [lineNum, Math.min(lineNum + 30, lineCount)],
        });
      }
    }
    return { filePath, language: "go", lineCount, symbols, imports, exports };
  }

  // 4. Rust
  if (ext === "rs") {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNum = i + 1;

      const fnMatch = line.match(/^(?:pub(?:\([^)]+\))?\s+)?(?:async\s+)?fn\s+([a-zA-Z0-9_]+)\s*(?:<[^>]+>)?\s*\(([^)]*)\)/);
      if (fnMatch) {
        symbols.push({
          name: fnMatch[1],
          kind: "function",
          lineRange: [lineNum, Math.min(lineNum + 25, lineCount)],
          signature: `fn ${fnMatch[1]}(${fnMatch[2]})`,
        });
        continue;
      }

      const structMatch = line.match(/^(?:pub(?:\([^)]+\))?\s+)?(struct|enum|trait)\s+([a-zA-Z0-9_]+)/);
      if (structMatch) {
        symbols.push({
          name: structMatch[2],
          kind: structMatch[1] === "trait" ? "interface" : "class",
          lineRange: [lineNum, Math.min(lineNum + 30, lineCount)],
        });
      }
    }
    return { filePath, language: "rust", lineCount, symbols, imports, exports };
  }

  // Fallback for docs/configs/other languages
  return { filePath, language: ext, lineCount, symbols, imports, exports };
}
