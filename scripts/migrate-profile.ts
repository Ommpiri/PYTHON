import pg from "pg";

// Node 20.6+ built-in env loader (no dotenv needed)
try {
  // @ts-ignore
  process.loadEnvFile(".env");
} catch {
  // Already loaded or .env not found — ignore
}

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set.");
  process.exit(1);
}

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    console.log("🔌 Connected to database. Migrating profile columns...");

    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_source TEXT DEFAULT 'oauth';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS github_username TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_username TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS website_url TEXT;
    `);

    console.log("✅ Profile columns migrated successfully.");
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});
