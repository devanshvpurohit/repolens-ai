import { parseGitHubUrl, type ParsedGitHubUrl } from "./url-parser.js";
import { shouldIncludeFile } from "./filter.js";
import { validateSafeUrl } from "./safety.js";

export interface RepoMetadata {
  owner: string;
  repo: string;
  name: string;
  description: string;
  defaultBranch: string;
  commitSha: string;
  subpath?: string;
  stars: number;
  forks: number;
  openIssues: number;
  primaryLanguage: string;
}

export interface TreeEntry {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
  url?: string;
}

export interface IngestedFile {
  path: string;
  content: string;
  sizeBytes: number;
  sha: string;
}

export class GitHubClient {
  private readonly token?: string;

  constructor(token?: string) {
    this.token = token || process.env.GITHUB_TOKEN;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "User-Agent": "RepoLens-AI/1.0",
      Accept: "application/vnd.github.v3+json",
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  async resolveRepository(urlOrParsed: string | ParsedGitHubUrl): Promise<RepoMetadata> {
    const parsed = typeof urlOrParsed === "string" ? parseGitHubUrl(urlOrParsed) : urlOrParsed;
    const repoApiUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`;
    validateSafeUrl(repoApiUrl);

    const repoRes = await fetch(repoApiUrl, {
      headers: this.getHeaders(),
    });

    if (!repoRes.ok) {
      if (repoRes.status === 404) {
        throw new Error(`Repository not found or private: ${parsed.owner}/${parsed.repo}`);
      }
      if (repoRes.status === 403) {
        throw new Error("GitHub API rate limit exceeded. Please configure a GITHUB_TOKEN or try again later.");
      }
      throw new Error(`GitHub API error (${repoRes.status}): ${await repoRes.text()}`);
    }

    const repoData = (await repoRes.json()) as any;
    const targetRef = parsed.ref || repoData.default_branch || "main";

    // Resolve immutable commit SHA
    const commitApiUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/commits/${encodeURIComponent(targetRef)}`;
    validateSafeUrl(commitApiUrl);

    const commitRes = await fetch(commitApiUrl, {
      headers: this.getHeaders(),
    });

    if (!commitRes.ok) {
      throw new Error(`Failed to resolve commit for ref '${targetRef}' (${commitRes.status}).`);
    }

    const commitData = (await commitRes.json()) as any;
    const commitSha = commitData.sha;

    return {
      owner: parsed.owner,
      repo: parsed.repo,
      name: repoData.name,
      description: repoData.description || "",
      defaultBranch: repoData.default_branch || "main",
      commitSha,
      subpath: parsed.subpath,
      stars: repoData.stargazers_count ?? 0,
      forks: repoData.forks_count ?? 0,
      openIssues: repoData.open_issues_count ?? 0,
      primaryLanguage: repoData.language || "Unknown",
    };
  }

  async fetchFilteredTree(
    meta: RepoMetadata,
    options?: { maxFiles?: number; maxSizeBytes?: number }
  ): Promise<TreeEntry[]> {
    const treeApiUrl = `https://api.github.com/repos/${meta.owner}/${meta.repo}/git/trees/${meta.commitSha}?recursive=1`;
    validateSafeUrl(treeApiUrl);

    const res = await fetch(treeApiUrl, {
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch Git tree (${res.status}): ${await res.text()}`);
    }

    const data = (await res.json()) as { tree: TreeEntry[]; truncated?: boolean };
    let entries = data.tree.filter((entry) => entry.type === "blob");

    // If subpath is specified, restrict to subpath
    if (meta.subpath) {
      const prefix = meta.subpath.endsWith("/") ? meta.subpath : `${meta.subpath}/`;
      entries = entries.filter((e) => e.path.startsWith(prefix) || e.path === meta.subpath);
    }

    // Filter out exclusions, secrets, binaries
    const maxSizeBytes = options?.maxSizeBytes ?? 500 * 1024;
    const filtered = entries.filter((entry) =>
      shouldIncludeFile(entry.path, {
        sizeBytes: entry.size,
        maxSizeBytes,
      })
    );

    const maxFiles = options?.maxFiles ?? 500;
    return filtered.slice(0, maxFiles);
  }

  async fetchFileContent(meta: RepoMetadata, path: string): Promise<IngestedFile> {
    const rawUrl = `https://raw.githubusercontent.com/${meta.owner}/${meta.repo}/${meta.commitSha}/${path}`;
    validateSafeUrl(rawUrl);

    const res = await fetch(rawUrl, {
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch file content for '${path}' (${res.status})`);
    }

    const content = await res.text();
    return {
      path,
      content,
      sizeBytes: Buffer.byteLength(content, "utf8"),
      sha: meta.commitSha,
    };
  }

  async fetchBatchFiles(
    meta: RepoMetadata,
    paths: string[],
    concurrency = 5
  ): Promise<IngestedFile[]> {
    const results: IngestedFile[] = [];
    const queue = [...paths];

    const worker = async () => {
      while (queue.length > 0) {
        const path = queue.shift();
        if (!path) break;
        try {
          const file = await this.fetchFileContent(meta, path);
          results.push(file);
        } catch {
          // If a file cannot be fetched, skip safely
        }
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, paths.length) }, () => worker());
    await Promise.all(workers);
    return results;
  }
}
