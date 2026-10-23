# RepoLens AI — Architecture & Integration Specification

## 1. Executive Summary

RepoLens AI is a production-oriented web application that analyzes and explains GitHub repositories using deterministic AST extraction, knowledge graphs, grounded RAG chat, and interactive visual exploration.

The project builds upon the open-source foundational work of **Understand Anything** (`@understand-anything/core` and `@understand-anything/dashboard`), adapted into a serverless-native, Vercel-first web architecture.

---

## 2. Upstream Project Inspection & Reuse Strategy

### Upstream Components Inspected
- **Schema & Types**: Upstream provides a 27-node-type and 38-edge-type schema representing codebases, configurations, services, tables, pipelines, and endpoints.
- **Graph Builder**: Deterministic relationship generation linking files, classes, functions, and imports.
- **Visual Presentation**: Interactive graph rendering built with React Flow (`@xyflow/react`), dagre hierarchical layout, and custom nodes.
- **Search & Filter**: Keyword, fuzzy, and semantic search utilities.

### Architectural Adaptations for Serverless (Vercel)
1. **Separation of Execution Contexts**:
   - The upstream plugin model ran inside local coding agents or CLI environments with unrestricted execution time and local disk access.
   - Vercel Functions have bounded execution time (typically 10s on Hobby, up to 60s/300s on Pro/Enterprise), limited memory, and ephemeral read-only file systems (outside `/tmp`).
   - RepoLens AI decomposes repository analysis into **bounded, resumable stages**:
     1. `inspect`: Resolves repo metadata, default branch, and immutable commit SHA via the GitHub REST API.
     2. `analyze`: Processes bounded batches of files (deterministic AST parsing + symbol extraction), checkpoints state, and resumes incrementally.
     3. `status`: Exposes durable progress tracking for polling or client updates.
     4. `graph`: Serves the validated `KnowledgeGraph`.
     5. `chat`: RAG-grounded question answering with strict token budgets and verified source line citations.

2. **Native Dependency Management**:
   - Upstream bundled native tree-sitter bindings for node.js.
   - Serverless Vercel functions cannot reliably execute arbitrary native compilation binaries across target platforms.
   - We utilize a hybrid static analyzer combining robust AST regex/lexical extractors and structured syntax parsers (TypeScript/JavaScript, Python, Go, Rust, Java, C++, Ruby, PHP, JSON, YAML, Markdown, Dockerfile, SQL) that run deterministically with zero native compile requirements.

3. **Multi-Provider AI Abstraction**:
   - Default provider: Google Gemini API (optimized for Gemini 2.5 Flash / 1.5 Flash on the free tier).
   - Additional providers: OpenAI (`gpt-4o-mini`), Anthropic Claude (`claude-3-5-sonnet`), and Ollama.
   - Deterministic AST extraction executes first, ensuring AI calls are only made when high-value contextual summaries or query syntheses are required.

---

## 3. High-Level System Architecture

```text
+-------------------------------------------------------------+
|                      User Browser                           |
|  React 19 + Vite + Tailwind CSS + Lucide + Monaco Editor   |
+-------------------------------------------------------------+
                              |  HTTPS
                              v
+-------------------------------------------------------------+
|               Vercel Edge & Serverless Functions            |
|                                                             |
|  /api/repositories/inspect  --> GitHub REST API (Trees/Blob)|
|  /api/repositories/analyze  --> Bounded Ingestion Pipeline  |
|  /api/repositories/status   --> Checkpoint & Progress Store |
|  /api/repositories/graph    --> Validated Knowledge Graph   |
|  /api/repositories/files    --> Source Retrieval & Cache    |
|  /api/chat                  --> RAG + Verified Citations    |
|  /api/settings/providers    --> BYOK & Provider Health Test |
+-------------------------------------------------------------+
            |                          |               |
            v                          v               v
   +------------------+       +---------------+  +------------+
   |   AI Providers   |       |   PostgreSQL  |  | GitHub API |
   | - Gemini (Free)  |       | (Neon/Vercel) |  | (Octokit/  |
   | - OpenAI         |       | - Revisions   |  |  REST API) |
   | - Anthropic      |       | - Chunks      |  +------------+
   | - Ollama (BYOK)  |       | - Graphs      |
   +------------------+       +---------------+
```

---

## 4. Ingestion & Security Guardrails

1. **SSRF Protection**:
   - Destination host allowlist: only `api.github.com` and `raw.githubusercontent.com`.
   - Rejection of private IPv4/IPv6 ranges (`127.0.0.1`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`, `::1`).
2. **Untrusted Code Execution**:
   - Repository code is **never executed**. Analysis is strictly static and structural.
3. **Secret Redaction**:
   - Secret-bearing patterns (`.env*`, `*.pem`, `id_rsa`, credentials) are excluded by default.
4. **Bounded Budgets**:
   - Configurable limits on file counts, file sizes (max 500 KB per file), and overall repo payload to avoid memory exhaustion.

---

## 5. Grounded RAG & Verified Source Citations

When answering questions in `/api/chat`:
1. Source files are chunked at logical symbol boundaries (functions, classes, modules) with explicit line spans (`startLine`, `endLine`).
2. Top-k relevant chunks are retrieved via semantic/lexical similarity and expanded to include graph neighbors.
3. The LLM receives the grounded context with strict instructions to only cite provided file lines.
4. RepoLens AI verifies each citation against the ingested file tree before delivering the response.
5. In the UI, clicking any citation jumps immediately to the exact file and highlights the line numbers in Monaco Editor.
