export interface LanguageInfo {
  id: string;
  name: string;
  category: "code" | "config" | "markup" | "data";
}

const EXT_TO_LANG: Record<string, LanguageInfo> = {
  ts: { id: "typescript", name: "TypeScript", category: "code" },
  tsx: { id: "typescriptreact", name: "TypeScript (React)", category: "code" },
  js: { id: "javascript", name: "JavaScript", category: "code" },
  jsx: { id: "javascriptreact", name: "JavaScript (React)", category: "code" },
  mjs: { id: "javascript", name: "JavaScript", category: "code" },
  cjs: { id: "javascript", name: "JavaScript", category: "code" },
  py: { id: "python", name: "Python", category: "code" },
  go: { id: "go", name: "Go", category: "code" },
  rs: { id: "rust", name: "Rust", category: "code" },
  java: { id: "java", name: "Java", category: "code" },
  c: { id: "c", name: "C", category: "code" },
  cpp: { id: "cpp", name: "C++", category: "code" },
  cc: { id: "cpp", name: "C++", category: "code" },
  h: { id: "c", name: "C Header", category: "code" },
  hpp: { id: "cpp", name: "C++ Header", category: "code" },
  cs: { id: "csharp", name: "C#", category: "code" },
  rb: { id: "ruby", name: "Ruby", category: "code" },
  php: { id: "php", name: "PHP", category: "code" },
  json: { id: "json", name: "JSON", category: "data" },
  yaml: { id: "yaml", name: "YAML", category: "config" },
  yml: { id: "yaml", name: "YAML", category: "config" },
  toml: { id: "toml", name: "TOML", category: "config" },
  md: { id: "markdown", name: "Markdown", category: "markup" },
  sql: { id: "sql", name: "SQL", category: "data" },
  sh: { id: "shell", name: "Shell", category: "code" },
  bash: { id: "shell", name: "Shell", category: "code" },
  dockerfile: { id: "dockerfile", name: "Dockerfile", category: "config" },
};

export function detectLanguage(filePath: string): LanguageInfo {
  const normalized = filePath.toLowerCase();
  const basename = normalized.split("/").pop() || "";

  if (basename === "dockerfile" || basename.startsWith("dockerfile.")) {
    return { id: "dockerfile", name: "Dockerfile", category: "config" };
  }

  const parts = basename.split(".");
  if (parts.length > 1) {
    const ext = parts.pop()!;
    if (EXT_TO_LANG[ext]) {
      return EXT_TO_LANG[ext];
    }
  }

  return { id: "plaintext", name: "Plain Text", category: "data" };
}
