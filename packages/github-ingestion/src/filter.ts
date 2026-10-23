export const EXCLUDED_DIR_PATTERNS = [
  /(^|\/)node_modules\//i,
  /(^|\/)vendor\//i,
  /(^|\/)dist\//i,
  /(^|\/)build\//i,
  /(^|\/)coverage\//i,
  /(^|\/)\.git\//i,
  /(^|\/)\.next\//i,
  /(^|\/)\.cache\//i,
  /(^|\/)target\//i,
  /(^|\/)__pycache__\//i,
  /(^|\/)\.pytest_cache\//i,
  /(^|\/)\.venv\//i,
  /(^|\/)venv\//i,
  /(^|\/)env\//i,
];

export const SECRET_PATTERNS = [
  /(^|\/)\.env(\..+)?$/i,
  /\.pem$/i,
  /\.key$/i,
  /(^|\/)id_rsa(\.pub)?$/i,
  /(^|\/)id_ed25519(\.pub)?$/i,
  /(^|\/)credentials\.json$/i,
  /(^|\/)service-account(\..+)?\.json$/i,
];

export const BINARY_EXTENSIONS = new Set([
  // Images
  "png", "jpg", "jpeg", "gif", "ico", "webp", "bmp", "tiff", "svg",
  // Archives & Executables
  "zip", "tar", "gz", "tgz", "bz2", "7z", "rar", "exe", "dll", "so", "dylib", "bin",
  // Documents & Media
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "mp3", "mp4", "wav", "avi", "mov",
  // Fonts & Bytecode
  "woff", "woff2", "ttf", "eot", "otf", "class", "pyc", "wasm", "lockb"
]);

export function isBinaryOrMediaFile(path: string): boolean {
  const ext = path.split(".").pop()?.toLowerCase();
  if (!ext) return false;
  return BINARY_EXTENSIONS.has(ext);
}

export function isSecretFile(path: string): boolean {
  return SECRET_PATTERNS.some((pattern) => pattern.test(path));
}

export function isExcludedDirectory(path: string): boolean {
  return EXCLUDED_DIR_PATTERNS.some((pattern) => pattern.test(path));
}

export function shouldIncludeFile(path: string, options?: { maxSizeBytes?: number; sizeBytes?: number }): boolean {
  if (isExcludedDirectory(path)) return false;
  if (isSecretFile(path)) return false;
  if (isBinaryOrMediaFile(path)) return false;

  // Minified file heuristics
  if (/\.min\.(js|css)$/i.test(path) || /-min\.(js|css)$/i.test(path)) {
    return false;
  }

  // Size limit (default 500 KB)
  if (options?.sizeBytes !== undefined) {
    const max = options.maxSizeBytes ?? 500 * 1024;
    if (options.sizeBytes > max) return false;
  }

  return true;
}
