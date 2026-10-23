import pg from "pg";
const { Pool } = pg;

export class PostgresStore {
  private pool: pg.Pool | null = null;
  private initialized = false;

  constructor(connectionString?: string) {
    const url = connectionString || process.env.DATABASE_URL;
    if (url) {
      this.pool = new Pool({
        connectionString: url,
        ssl: url.includes("localhost") || url.includes("127.0.0.1") ? false : { rejectUnauthorized: false },
      });
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
    } catch (e) {
      console.warn("Could not initialize Postgres schema:", e);
    }
  }
}
