import { createRequire as __createRequire } from "module";
import { fileURLToPath as __fileURLToPath } from "url";
import { dirname as __dirnameFunction } from "path";
const require = __createRequire(import.meta.url);
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __dirnameFunction(__filename);


// packages/shared/src/demo-data.ts
var DEMO_PROJECT_ID = "demo-express-react-app";
var DEMO_GRAPH = {
  version: "1.0.0",
  kind: "codebase",
  project: {
    name: "RepoLens Sample App (Fixture)",
    owner: "repolens-ai",
    languages: ["TypeScript", "React", "PostgreSQL"],
    frameworks: ["Vite", "Express", "TailwindCSS"],
    description: "Production sample repository demonstrating full-stack architecture with frontend, API routes, authentication, and database models.",
    analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
    gitCommitHash: "9a7f3d2e1b4c6809ef0123456789abcdef012345",
    totalFiles: 6,
    totalNodes: 12,
    totalEdges: 14
  },
  nodes: [
    {
      id: "file:src/App.tsx",
      type: "file",
      name: "App.tsx",
      filePath: "src/App.tsx",
      lineRange: [1, 45],
      summary: "Main client application component mounting React Router, Navigation bar, and dashboard layout.",
      tags: ["react", "ui", "typescript"],
      complexity: "simple"
    },
    {
      id: "function:src/App.tsx#App",
      type: "function",
      name: "App",
      filePath: "src/App.tsx",
      lineRange: [12, 42],
      summary: "Root React component managing global navigation and theme state.",
      tags: ["react", "component"],
      complexity: "simple"
    },
    {
      id: "file:src/components/UserDashboard.tsx",
      type: "file",
      name: "UserDashboard.tsx",
      filePath: "src/components/UserDashboard.tsx",
      lineRange: [1, 60],
      summary: "User dashboard showing active projects and repository metrics.",
      tags: ["react", "ui"],
      complexity: "moderate"
    },
    {
      id: "file:api/routes/auth.ts",
      type: "file",
      name: "auth.ts",
      filePath: "api/routes/auth.ts",
      lineRange: [1, 55],
      summary: "Authentication router handling user login, signup, and session validation.",
      tags: ["api", "auth", "express"],
      complexity: "moderate"
    },
    {
      id: "endpoint:api/routes/auth.ts#POST /api/login",
      type: "endpoint",
      name: "POST /api/login",
      filePath: "api/routes/auth.ts",
      lineRange: [18, 38],
      summary: "Authenticates user credentials against the database and returns a signed JWT session cookie.",
      tags: ["endpoint", "security"],
      complexity: "moderate"
    },
    {
      id: "file:api/routes/repositories.ts",
      type: "file",
      name: "repositories.ts",
      filePath: "api/routes/repositories.ts",
      lineRange: [1, 80],
      summary: "Repository inspection and analysis API endpoints.",
      tags: ["api", "routes"],
      complexity: "complex"
    },
    {
      id: "file:src/services/db.ts",
      type: "file",
      name: "db.ts",
      filePath: "src/services/db.ts",
      lineRange: [1, 50],
      summary: "PostgreSQL connection pool and query execution wrapper.",
      tags: ["database", "storage"],
      complexity: "moderate"
    },
    {
      id: "class:src/services/db.ts#DatabasePool",
      type: "class",
      name: "DatabasePool",
      filePath: "src/services/db.ts",
      lineRange: [15, 48],
      summary: "Manages database client connections with connection retry logic.",
      tags: ["class", "database"],
      complexity: "moderate"
    }
  ],
  edges: [
    {
      source: "file:src/App.tsx",
      target: "function:src/App.tsx#App",
      type: "contains",
      direction: "forward",
      weight: 1
    },
    {
      source: "file:src/App.tsx",
      target: "file:src/components/UserDashboard.tsx",
      type: "imports",
      direction: "forward",
      description: "imports UserDashboard",
      weight: 0.8
    },
    {
      source: "file:api/routes/auth.ts",
      target: "endpoint:api/routes/auth.ts#POST /api/login",
      type: "contains",
      direction: "forward",
      weight: 1
    },
    {
      source: "file:api/routes/auth.ts",
      target: "file:src/services/db.ts",
      type: "imports",
      direction: "forward",
      description: "imports DatabasePool",
      weight: 0.7
    },
    {
      source: "file:api/routes/repositories.ts",
      target: "file:src/services/db.ts",
      type: "imports",
      direction: "forward",
      description: "queries stored projects",
      weight: 0.7
    }
  ],
  layers: [
    {
      id: "layer-ui",
      name: "Frontend & Presentation",
      description: "Client React components and UI pages.",
      nodeIds: ["file:src/App.tsx", "function:src/App.tsx#App", "file:src/components/UserDashboard.tsx"]
    },
    {
      id: "layer-api",
      name: "API & Routing",
      description: "Express routes and HTTP endpoints.",
      nodeIds: ["file:api/routes/auth.ts", "endpoint:api/routes/auth.ts#POST /api/login", "file:api/routes/repositories.ts"]
    },
    {
      id: "layer-data",
      name: "Data & Storage",
      description: "Database connection pools and persistence.",
      nodeIds: ["file:src/services/db.ts", "class:src/services/db.ts#DatabasePool"]
    }
  ],
  tour: [
    {
      order: 1,
      title: "Welcome to the Sample Repository",
      description: "Explore the fixture architecture. This interactive demonstration runs fully client-side with realistic code and knowledge graph.",
      nodeIds: ["file:src/App.tsx", "file:api/routes/auth.ts", "file:src/services/db.ts"]
    },
    {
      order: 2,
      title: "Authentication Pipeline",
      description: "Tracing from user authentication down to the database connection pool.",
      nodeIds: ["endpoint:api/routes/auth.ts#POST /api/login", "class:src/services/db.ts#DatabasePool"]
    }
  ]
};
var DEMO_FILES = [
  {
    path: "src/App.tsx",
    content: `import React from 'react';
import { UserDashboard } from './components/UserDashboard';

export function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="p-4 border-b border-slate-800">
        <h1 className="text-xl font-bold">RepoLens AI Sample</h1>
      </header>
      <main className="p-6">
        <UserDashboard />
      </main>
    </div>
  );
}

export default App;
`,
    sizeBytes: 420,
    sha: "9a7f3d2e1b4c6809ef0123456789abcdef012345"
  },
  {
    path: "src/components/UserDashboard.tsx",
    content: `import React, { useState, useEffect } from 'react';

export function UserDashboard() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Repository Metrics</h2>
      <p className="text-slate-400">Analysis complete. Explore knowledge graph nodes and trace source citations.</p>
    </div>
  );
}
`,
    sizeBytes: 380,
    sha: "9a7f3d2e1b4c6809ef0123456789abcdef012345"
  },
  {
    path: "api/routes/auth.ts",
    content: `import { Router } from 'express';
import { db } from '../services/db';

const router = Router();

// POST /api/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username or password' });
  }

  const user = await db.query('SELECT * FROM users WHERE username = $1', [username]);
  if (!user.rows[0]) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  return res.json({ token: 'mock-jwt-token-session-123' });
});

export default router;
`,
    sizeBytes: 600,
    sha: "9a7f3d2e1b4c6809ef0123456789abcdef012345"
  },
  {
    path: "src/services/db.ts",
    content: `import { Pool } from 'pg';

export class DatabasePool {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  async query(text: string, params: any[] = []) {
    return this.pool.query(text, params);
  }
}

export const db = new DatabasePool();
`,
    sizeBytes: 310,
    sha: "9a7f3d2e1b4c6809ef0123456789abcdef012345"
  }
];
var DEMO_CHUNKS = [
  {
    id: "src/App.tsx#App:4-16",
    filePath: "src/App.tsx",
    startLine: 4,
    endLine: 16,
    symbolName: "App",
    symbolKind: "function",
    content: `export function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">...`,
    commitSha: "9a7f3d2e1b4c6809ef0123456789abcdef012345"
  },
  {
    id: "api/routes/auth.ts#POST /api/login:6-20",
    filePath: "api/routes/auth.ts",
    startLine: 6,
    endLine: 20,
    symbolName: "POST /api/login",
    symbolKind: "endpoint",
    content: `router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) { ...`,
    commitSha: "9a7f3d2e1b4c6809ef0123456789abcdef012345"
  },
  {
    id: "src/services/db.ts#DatabasePool:3-17",
    filePath: "src/services/db.ts",
    startLine: 3,
    endLine: 17,
    symbolName: "DatabasePool",
    symbolKind: "class",
    content: `export class DatabasePool {
  private pool: Pool;
  constructor() { ...`,
    commitSha: "9a7f3d2e1b4c6809ef0123456789abcdef012345"
  }
];
function getDemoProject() {
  const filesMap = /* @__PURE__ */ new Map();
  for (const f of DEMO_FILES) {
    filesMap.set(f.path, f);
  }
  return {
    id: DEMO_PROJECT_ID,
    name: "RepoLens Sample App (Fixture Demo)",
    owner: "repolens-ai",
    repo: "sample-demo-app",
    commitSha: "9a7f3d2e1b4c6809ef0123456789abcdef012345",
    repoUrl: "https://github.com/repolens-ai/sample-demo-app",
    metadata: {
      owner: "repolens-ai",
      repo: "sample-demo-app",
      name: "sample-demo-app",
      description: "Interactive demo fixture with precomputed graph and real citations.",
      defaultBranch: "main",
      commitSha: "9a7f3d2e1b4c6809ef0123456789abcdef012345",
      stars: 340,
      forks: 42,
      openIssues: 3,
      primaryLanguage: "TypeScript"
    },
    graph: DEMO_GRAPH,
    files: filesMap,
    chunks: DEMO_CHUNKS,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}

// packages/shared/src/store.ts
var MemoryStore = class {
  projects = /* @__PURE__ */ new Map();
  jobs = /* @__PURE__ */ new Map();
  saveJob(job) {
    job.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.jobs.set(job.id, job);
  }
  getJob(id) {
    return this.jobs.get(id);
  }
  saveProject(project) {
    this.projects.set(project.id, project);
  }
  getProject(id) {
    return this.projects.get(id);
  }
  findProjectByRepo(owner, repo, commitSha) {
    for (const p of this.projects.values()) {
      if (p.owner.toLowerCase() === owner.toLowerCase() && p.repo.toLowerCase() === repo.toLowerCase()) {
        if (!commitSha || p.commitSha === commitSha) {
          return p;
        }
      }
    }
    return void 0;
  }
  listProjects() {
    return Array.from(this.projects.values()).map((p) => ({
      id: p.id,
      name: p.name,
      owner: p.owner,
      repo: p.repo,
      commitSha: p.commitSha,
      repoUrl: p.repoUrl,
      metadata: p.metadata,
      graph: p.graph,
      createdAt: p.createdAt
    }));
  }
};
var globalStore = globalThis.__repolens_store || new MemoryStore();
if (!globalStore.getProject("demo-express-react-app")) {
  globalStore.saveProject(getDemoProject());
}
globalThis.__repolens_store = globalStore;
function getRepositoryStore() {
  return globalStore;
}

// packages/shared/src/api-utils.ts
function sendJson(res, statusCode, data) {
  if (res.headersSent) return;
  try {
    res.statusCode = statusCode;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");
    res.end(JSON.stringify(data));
  } catch {
  }
}

// api-src/repositories/files.ts
async function handler(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method not allowed. Use GET." });
  }
  const url = new URL(req.url || "/", "http://localhost");
  const id = url.searchParams.get("id");
  const path = url.searchParams.get("path");
  if (!id || !path) {
    return sendJson(res, 400, { error: "Both 'id' and 'path' query parameters are required." });
  }
  const store = getRepositoryStore();
  const project = store.getProject(id);
  if (!project) {
    return sendJson(res, 404, { error: `Project '${id}' not found.` });
  }
  const file = project.files.get(path);
  if (!file) {
    return sendJson(res, 404, { error: `File '${path}' not found in project.` });
  }
  return sendJson(res, 200, {
    path: file.path,
    content: file.content,
    sizeBytes: file.sizeBytes,
    sha: file.sha
  });
}
export {
  handler as default
};
