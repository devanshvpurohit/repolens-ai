import { describe, it, expect } from "vitest";
import { RepoAuditor } from "@repolens/analysis-adapter";
import type { IngestedFile } from "@repolens/github-ingestion";

describe("RepoAuditor - Repository Code & Config Audit", () => {
  it("detects incomplete checklists, placeholder tokens, and deployment issues", () => {
    const mockFiles: IngestedFile[] = [
      {
        path: "DEPLOYMENT.md",
        content: `# Deployment Guide\n\n- [ ] Event Registration URL needs verification\n- [x] Initial build\n- [ ] Contact Information to be added\nVITE_GA_ID=G-XXXXXXXXXX`,
        sizeBytes: 200,
        sha: "abc",
      },
      {
        path: "package.json",
        content: JSON.stringify({
          name: "demo-app",
          dependencies: {
            react: "^19.0.0",
          },
          scripts: {
            build: "vite build",
          },
        }),
        sizeBytes: 150,
        sha: "def",
      },
      {
        path: "src/api.ts",
        content: `export function fetchData() {\n  fetch("/api/data").then(res => res.json());\n  // TODO: Add error handling\n}`,
        sizeBytes: 120,
        sha: "ghi",
      },
    ];

    const report = RepoAuditor.auditFiles("test-proj", mockFiles);

    expect(report.summary.totalIssues).toBeGreaterThan(0);

    // Checklist issues
    const checklists = report.categories.checklist;
    expect(checklists.some((c) => c.title.includes("Event Registration URL"))).toBe(true);
    expect(checklists.some((c) => c.title.includes("Contact Information"))).toBe(true);
    expect(checklists.some((c) => c.title.includes("TODO"))).toBe(true);

    // Placeholder GA
    const configIssues = report.categories.config;
    expect(configIssues.some((c) => c.title.includes("G-XXXXXXXXXX"))).toBe(true);

    // SPA routing check (React frontend without vercel.json)
    const deployIssues = report.categories.deployment;
    expect(deployIssues.some((d) => d.title.includes("SPA Routing"))).toBe(true);

    // Bug check (floating promise)
    const bugIssues = report.categories.bugs;
    expect(bugIssues.some((b) => b.title.includes("Promise Rejection"))).toBe(true);

    // Passed checks
    expect(report.passedChecks.length).toBeGreaterThan(0);
    expect(report.passedChecks.some((p) => p.includes("build script"))).toBe(true);

    // Deep in-depth metrics
    expect(report.summary.totalFilesAnalyzed).toBe(3);
    expect(report.summary.totalLinesOfCode).toBeGreaterThan(0);
    expect(report.summary.codeHealthScore).toBeGreaterThanOrEqual(0);
    expect(report.summary.codeHealthScore).toBeLessThanOrEqual(100);
    expect(["A+", "A", "B", "C", "D", "F"]).toContain(report.summary.healthGrade);
  });

  it("cross-audits environment variables against .env.example", () => {
    const mockFiles: IngestedFile[] = [
      {
        path: ".env.example",
        content: "DATABASE_URL=postgres://...\nPUBLIC_KEY=abc",
        sizeBytes: 50,
        sha: "env1",
      },
      {
        path: "src/server.ts",
        content: `const secret = process.env.SECRET_TOKEN;\nconst db = process.env.DATABASE_URL;\ncatch (e) {}`,
        sizeBytes: 80,
        sha: "srv1",
      },
    ];

    const report = RepoAuditor.auditFiles("env-test", mockFiles);
    expect(report.categories.env.some((e) => e.title.includes("SECRET_TOKEN"))).toBe(true);
    expect(report.categories.bugs.some((b) => b.title.includes("Silent Error Swallowing"))).toBe(true);
  });
});
