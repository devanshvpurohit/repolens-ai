# RepoLens AI — Codebase Knowledge Graphs & Grounded Architecture AI

> Built on the foundational open-source architecture of [Understand Anything](https://github.com/Egonex-AI/Understand-Anything), adapted into a production-oriented, serverless-native web application deployed on Vercel.

---

## 1. Overview

**RepoLens AI** explains GitHub repositories through interactive AST knowledge graphs, grounded RAG chat, multi-language source code navigation, architecture layer categorization, and verified line-level citations.

### Key Capabilities
- **Deterministic AST & Symbol Extraction**: Parses TypeScript/JavaScript, Python, Go, Rust, Java, C/C++, Dockerfiles, SQL, and YAML into structured entities without executing untrusted code.
- **Interactive React Flow Knowledge Graph**: Explores relationships between files, classes, functions, and API endpoints with hierarchical dagre layout, minimap, dependency highlighting, and layer filtering.
- **Grounded Chat with Verified Citations**: Every AI response cites exact file line numbers (`[src/App.tsx:12-42]`). Clicking citations jumps directly to highlighted lines in Monaco Editor.
- **Gemini Free-Tier-First AI**: Pre-configured for Google Gemini Flash (`gemini-2.5-flash`), with token budgeting, exponential backoff, structured prompting, and cache hashing.
- **Multi-Provider BYOK Architecture**: Seamless support for Google Gemini, OpenAI (`gpt-4o-mini`), Anthropic Claude (`claude-3-5-sonnet`), and Ollama.
- **Vercel Serverless Architecture**: Analysis operations are decomposed into bounded, resumable steps (`inspect` -> `analyze` -> `status` -> `graph` -> `chat`), guaranteeing zero timeout failures on serverless runtimes.
- **Security & SSRF Hardening**: Host allowlisting, IP blocking for localhost/metadata endpoints (`169.254.169.254`), secret file filtering (`.env*`, `*.pem`, `id_rsa`), and zero execution of repository code.

---

## 2. Project Structure

```text
repolens-ai/
├── src/
│   ├── app/
│   │   ├── App.tsx                   # Main layout and navbar
│   │   ├── routes.tsx                # SPA routing definitions
│   │   └── providers.tsx             # Context providers
│   ├── components/
│   │   ├── repository/
│   │   │   ├── Sidebar.tsx           # Repo metadata, layers, node filters
│   │   │   ├── FileExplorer.tsx      # Recursive interactive file tree
│   │   │   └── NodeDetailPanel.tsx   # Selected component details & relationships
│   │   ├── graph/
│   │   │   ├── KnowledgeGraphView.tsx# React Flow canvas with dagre layout
│   │   │   └── CustomNode.tsx        # Styled node cards for files/functions/endpoints
│   │   ├── chat/
│   │   │   └── ChatPanel.tsx         # Grounded AI conversation & citation pills
│   │   ├── source-viewer/
│   │   │   └── MonacoViewer.tsx      # Monaco Editor with line range highlighting
│   │   └── ui/
│   │       └── Navbar.tsx            # Header navigation & quick links
│   ├── pages/
│   │   ├── LandingPage.tsx           # Hero, URL input, demo preview, feature grid
│   │   ├── AnalyzePage.tsx           # Bounded batch analysis & live progress bar
│   │   ├── ProjectDashboardPage.tsx  # 3-panel workspace (Graph, Code, Details)
│   │   ├── ChatPage.tsx              # Split view (Grounded Chat + Monaco)
│   │   ├── ProjectsListPage.tsx      # Saved projects registry
│   │   ├── AISettingsPage.tsx        # Provider config & live connection test
│   │   └── PrivacyPage.tsx           # Ingestion safety & security specs
│   ├── lib/
│   │   └── api-client.ts             # Typed frontend API client
│   └── stores/
│       └── repo-store.ts             # Zustand global reactive state
├── api/
│   ├── health.ts                     # System, provider & DB health check
│   ├── repositories/
│   │   ├── inspect.ts                # URL validation & commit SHA resolution
│   │   ├── analyze.ts                # Bounded batch AST analysis & checkpointing
│   │   ├── status.ts                 # Real-time job progress polling
│   │   ├── graph.ts                  # Serves validated KnowledgeGraph
│   │   ├── files.ts                  # File content retrieval for Monaco Editor
│   │   └── search.ts                 # Full-text & symbol search
│   ├── chat/
│   │   └── index.ts                  # Grounded RAG with citation verification
│   └── settings/
│       └── providers.ts              # Provider settings & connectivity testing
├── packages/
│   ├── graph-schema/                 # Zod schema, validation, autoFixGraph, types
│   ├── github-ingestion/             # GitHub API client, SSRF safety, file filters
│   ├── analysis-adapter/             # AST symbol extractor, layer detector, graph builder
│   ├── ai-providers/                 # Gemini, OpenAI, Claude, Ollama adapters & BYOK
│   ├── retrieval/                    # Source chunker, keyword search, citation validator
│   └── shared/                       # In-memory & PostgreSQL persistence stores, demo data
├── tests/
│   ├── unit/                         # Unit tests (ingestion, schema, AST, retrieval, AI)
│   └── integration/                  # Pipeline integration tests
├── docs/
│   └── ARCHITECTURE.md               # Upstream inspection & architectural specification
├── index.html
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
├── vite.config.ts
└── vercel.json
```

---

## 3. Upstream Components Reused & Adapted

From **Understand Anything** (`@understand-anything/core` and `@understand-anything/dashboard`):
- **Graph Schema**: Preserved the canonical 27-node-type and 38-edge-type schema definitions, extended with Zod validation and auto-fixing of dangling references.
- **Graph Visualization**: Reused React Flow layout patterns, converting them to modern React 19 + `@xyflow/react` v12 with Dagre hierarchical layout.
- **Architecture Layer Detection**: Adapted upstream layer classification heuristics (UI, API, Services, Data, Infrastructure).
- **Search & Retrieval**: Reused symbol-aware indexing concepts for RAG context extraction.
- **Serverless Adaptation**: Replaced unrestricted local process executions with bounded, resumable Vercel function endpoints.

---

## 4. Local Development

### Prerequisites
- Node.js >= 20 (v22 recommended)
- `pnpm` >= 9 (v12 supported)

### Setup & Run

```bash
# 1. Clone or enter directory
cd repolens-ai

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env.local

# 4. Start local development server
pnpm dev
```

Visit **`http://localhost:3000`** in your browser. The Vite development server includes a built-in API proxy middleware that executes the `/api/*` serverless functions locally without requiring the Vercel CLI.

### Run Tests

```bash
# Run unit & integration test suite
pnpm test

# Run type check
pnpm typecheck

# Production build
pnpm build
```

---

## 5. Environment Variables & Gemini Free Tier Setup

Create a `.env.local` file with the following keys:

```dotenv
NODE_ENV=development

# Google Gemini API (Default Free-Tier Provider)
# 1. Obtain a free key from Google AI Studio: https://aistudio.google.com/
# 2. Free tier grants access to Gemini Flash with zero charges.
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# OpenAI API (Optional)
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

# Anthropic Claude API (Optional)
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Ollama (Optional for local development)
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2

# GitHub Token (Optional: Increases rate limit from 60 to 5,000 req/hr)
GITHUB_TOKEN=

# PostgreSQL Database (Optional: Neon / Supabase / Vercel Postgres)
# If omitted, RepoLens AI runs in ephemeral in-memory storage mode.
DATABASE_URL=
```

---

## 6. Vercel Deployment

Deploy directly using the Vercel CLI or Vercel Web Dashboard:

### Option A: Vercel CLI

```bash
# 1. Login to Vercel
pnpm exec vercel login

# 2. Deploy preview
pnpm exec vercel

# 3. Deploy to production
pnpm exec vercel --prod
```

### Option B: Vercel Dashboard
1. Import repository on [vercel.com](https://vercel.com).
2. Framework Preset: **Vite**.
3. Build Command: `pnpm build`.
4. Output Directory: `dist`.
5. Add `GEMINI_API_KEY` in **Project Settings > Environment Variables**.
6. (Optional) Connect a Vercel Postgres or Neon database to automatically set `DATABASE_URL`.

---

## 7. Verification & Test Results

The test suite executed with Vitest:
- **`tests/unit/github-ingestion.test.ts`**: URL parsing, branch resolution, SSRF blocking, private IP rejection, file filtering (11/11 passed).
- **`tests/unit/graph-schema.test.ts`**: Schema validation, dangling edge rejection, node deduplication (3/3 passed).
- **`tests/unit/ast-extractor.test.ts`**: TypeScript, Python, Go, and Rust symbol extraction (3/3 passed).
- **`tests/unit/retrieval.test.ts`**: AST chunking, keyword retrieval, citation extraction, line clamping (4/4 passed).
- **`tests/unit/ai-providers.test.ts`**: Gemini, OpenAI, Claude, and Ollama adapter safety (4/4 passed).
- **`tests/integration/pipeline.test.ts`**: End-to-end repository AST analysis and search pipeline (2/2 passed).

**Total: 27 / 27 tests passing (100% pass rate).**

---

## 8. Known Limitations & Future Enhancements

- **Free-Tier GitHub Rate Limits**: Unauthenticated GitHub API calls are limited to 60 requests/hour per IP. For high-volume analysis of large repositories, set `GITHUB_TOKEN`.
- **Serverless Bounded Batches**: Repositories with over 1,000 files are sampled to the top 200–500 key source files to fit within Vercel execution timeouts.
- **Static Analysis Scope**: Static AST analysis reveals code structure and call graphs, but does not capture dynamic runtime behavior (e.g. database query records or third-party webhooks).
