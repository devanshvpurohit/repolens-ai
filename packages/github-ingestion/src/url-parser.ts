export interface ParsedGitHubUrl {
  owner: string;
  repo: string;
  ref?: string;
  subpath?: string;
  normalizedUrl: string;
}

export function parseGitHubUrl(inputUrl: string): ParsedGitHubUrl {
  const trimmed = inputUrl.trim();
  if (!trimmed) {
    throw new Error("Repository URL cannot be empty.");
  }

  // Reject malicious path traversals before normalization
  if (trimmed.includes("..") || trimmed.includes("%2e%2e") || trimmed.includes("%2E%2E")) {
    throw new Error("Path traversal characters ('..') are not allowed in GitHub URLs.");
  }

  // Handle shorthand "owner/repo"
  let urlToParse = trimmed;
  if (/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(trimmed)) {
    urlToParse = `https://github.com/${trimmed}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(urlToParse);
  } catch {
    throw new Error(`Invalid URL format: "${trimmed}"`);
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname !== "github.com" && hostname !== "www.github.com") {
    throw new Error(`Unsupported host: "${hostname}". Only github.com is supported.`);
  }

  // Pathname: /owner/repo[/tree/ref[/subpath]]
  const segments = parsed.pathname
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);

  if (segments.length < 2) {
    throw new Error("GitHub URL must contain at least owner and repository name (e.g., https://github.com/owner/repo).");
  }

  const owner = segments[0];
  let repo = segments[1];
  if (repo.endsWith(".git")) {
    repo = repo.slice(0, -4);
  }

  // Check for tree / branch / subpath
  let ref: string | undefined;
  let subpath: string | undefined;

  if (segments.length >= 4 && segments[2] === "tree") {
    ref = segments[3];
    if (segments.length > 4) {
      subpath = segments.slice(4).join("/");
    }
  }

  // Reject malicious path traversals
  if (owner.includes("..") || repo.includes("..") || (subpath && subpath.includes(".."))) {
    throw new Error("Path traversal characters ('..') are not allowed in GitHub URLs.");
  }

  const normalizedUrl = `https://github.com/${owner}/${repo}`;

  return {
    owner,
    repo,
    ref,
    subpath,
    normalizedUrl,
  };
}
