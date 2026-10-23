export class PostgresStore {
  private pool: any = null;
  private initialized = false;

  constructor(connectionString?: string) {
    const url = connectionString || (typeof process !== "undefined" ? process.env.DATABASE_URL : undefined);
    if (url) {
      try {
        // Dynamically load pg only when DATABASE_URL is present
        import("pg").then((pgModule) => {
          const Pool = pgModule.default?.Pool || pgModule.Pool;
          if (Pool) {
            this.pool = new Pool({
              connectionString: url,
              ssl: url.includes("localhost") || url.includes("127.0.0.1") ? false : { rejectUnauthorized: false },
            });
          }
        }).catch((err) => {
          console.warn("PostgreSQL driver load skipped:", err.message);
        });
      } catch {
        // Fallback to in-memory store
      }
    }
  }

  isAvailable(): boolean {
    return this.pool !== null;
  }

  async initSchema(): Promise<void> {
    if (!this.pool || this.initialized) return;

    const query = `
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(255) PRIMARY KEY,
        owner VARCHAR(255) NOT NULL,
        repo VARCHAR(255) NOT NULL,
        commit_sha VARCHAR(255) NOT NULL,
        repo_url TEXT NOT NULL,
        metadata JSONB NOT NULL,
        graph JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS analysis_jobs (
        id VARCHAR(255) PRIMARY KEY,
        repo_url TEXT NOT NULL,
        owner VARCHAR(255) NOT NULL,
        repo VARCHAR(255) NOT NULL,
        commit_sha VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        progress INT DEFAULT 0,
        current_stage VARCHAR(100) NOT NULL,
        error_message TEXT,
        total_files INT DEFAULT 0,
        processed_files INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    try {
      await this.pool.query(query);
      this.initialized = true;
    } catch (e: any) {
      console.warn("Failed to initialize PostgreSQL schema:", e.message);
    }
  }

  async saveProject(project: any): Promise<void> {
    if (!this.pool) return;
    await this.initSchema();

    const query = `
      INSERT INTO projects (id, owner, repo, commit_sha, repo_url, metadata, graph)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        metadata = EXCLUDED.metadata,
        graph = EXCLUDED.graph;
    `;

    await this.pool.query(query, [
      project.id,
      project.owner,
      project.repo,
      project.commitSha,
      project.repoUrl,
      JSON.stringify(project.metadata),
      JSON.stringify(project.graph),
    ]);
  }

  async getProject(id: string): Promise<any | null> {
    if (!this.pool) return null;
    await this.initSchema();

    const res = await this.pool.query("SELECT * FROM projects WHERE id = $1", [id]);
    if (res.rows.length === 0) return null;

    const row = res.rows[0];
    return {
      id: row.id,
      name: `${row.owner}/${row.repo}`,
      owner: row.owner,
      repo: row.repo,
      commitSha: row.commit_sha,
      repoUrl: row.repo_url,
      metadata: row.metadata,
      graph: row.graph,
      files: new Map(),
      chunks: [],
      createdAt: row.created_at,
    };
  }
}
