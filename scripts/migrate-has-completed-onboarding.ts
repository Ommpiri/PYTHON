import pg from "pg";

try {
  // @ts-ignore
  process.loadEnvFile(".env");
} catch {
  // Ignore
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
    console.log("🔌 Connected to database. Migrating onboarding column...");

    // 1. Add the new column
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT FALSE;
    `);

    // 2. Set existing users to true. We know they are existing if they don't have onboarding_completed
    // Wait, let's just set all current users to true because they were created before this feature.
    await client.query(`
      UPDATE users SET has_completed_onboarding = TRUE;
    `);

    // 3. Drop the old column from the previous implementation
    await client.query(`
      ALTER TABLE users DROP COLUMN IF EXISTS onboarding_completed;
    `);

    console.log("✅ Onboarding column migrated successfully.");
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});
