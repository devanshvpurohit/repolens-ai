import { describe, it, expect } from "vitest";
import { parseGitHubUrl } from "@repolens/github-ingestion";
import { isAllowedHost, validateSafeUrl } from "@repolens/github-ingestion";
import { shouldIncludeFile, isSecretFile, isBinaryOrMediaFile } from "@repolens/github-ingestion";

describe("GitHub Ingestion - URL Parsing", () => {
  it("parses standard github repo URLs", () => {
    const res = parseGitHubUrl("https://github.com/expressjs/express");
    expect(res.owner).toBe("expressjs");
    expect(res.repo).toBe("express");
    expect(res.normalizedUrl).toBe("https://github.com/expressjs/express");
  });

  it("parses shorthand owner/repo", () => {
    const res = parseGitHubUrl("pallets/flask");
    expect(res.owner).toBe("pallets");
    expect(res.repo).toBe("flask");
  });

  it("parses branches and subpaths", () => {
    const res = parseGitHubUrl("https://github.com/facebook/react/tree/main/packages/react");
    expect(res.owner).toBe("facebook");
    expect(res.repo).toBe("react");
    expect(res.ref).toBe("main");
    expect(res.subpath).toBe("packages/react");
  });

  it("rejects invalid hosts", () => {
    expect(() => parseGitHubUrl("https://gitlab.com/owner/repo")).toThrow(/Only github.com is supported/);
  });

  it("rejects path traversal attempts", () => {
    expect(() => parseGitHubUrl("https://github.com/../../etc/passwd")).toThrow(/Path traversal/);
  });
});

describe("GitHub Ingestion - SSRF & Safety Protection", () => {
  it("allows safe github domains", () => {
    expect(isAllowedHost("https://api.github.com/repos/owner/repo")).toBe(true);
    expect(isAllowedHost("https://raw.githubusercontent.com/owner/repo/main/file.ts")).toBe(true);
  });

  it("blocks localhost, 127.0.0.1 and private IPs", () => {
    expect(isAllowedHost("http://localhost:3000/api")).toBe(false);
    expect(isAllowedHost("http://127.0.0.1:8080")).toBe(false);
    expect(isAllowedHost("http://192.168.1.1/secret")).toBe(false);
    expect(isAllowedHost("http://10.0.0.1/admin")).toBe(false);
    expect(isAllowedHost("http://169.254.169.254/latest/meta-data/")).toBe(false);
  });

  it("throws on unsafe URLs", () => {
    expect(() => validateSafeUrl("http://169.254.169.254")).toThrow(/SSRF Protection/);
  });
});

describe("GitHub Ingestion - File & Secret Filtering", () => {
  it("filters out secrets like .env and private keys", () => {
    expect(isSecretFile(".env")).toBe(true);
    expect(isSecretFile("config/.env.local")).toBe(true);
    expect(isSecretFile("server.pem")).toBe(true);
    expect(isSecretFile("id_rsa")).toBe(true);
    expect(isSecretFile("src/index.ts")).toBe(false);
  });

  it("identifies binary files", () => {
    expect(isBinaryOrMediaFile("logo.png")).toBe(true);
    expect(isBinaryOrMediaFile("bundle.zip")).toBe(true);
    expect(isBinaryOrMediaFile("core.wasm")).toBe(true);
    expect(isBinaryOrMediaFile("font.woff2")).toBe(true);
    expect(isBinaryOrMediaFile("script.js")).toBe(false);
  });

  it("excludes node_modules and oversized files", () => {
    expect(shouldIncludeFile("node_modules/react/index.js")).toBe(false);
    expect(shouldIncludeFile("dist/bundle.js")).toBe(false);
    expect(shouldIncludeFile("src/app.tsx")).toBe(true);
    expect(shouldIncludeFile("src/big.ts", { sizeBytes: 600 * 1024, maxSizeBytes: 500 * 1024 })).toBe(false);
  });
});
