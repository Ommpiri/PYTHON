/**
 * setup-db.ts
 * Run once to create all required tables for Auth.js + app progress.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/setup-db.ts
 *
 * Requires DATABASE_URL in .env
 */

// Node 20.6+ built-in env loader (no dotenv needed)
try {
  // @ts-ignore — process.loadEnvFile exists in Node 20.6+
  process.loadEnvFile(".env");
} catch {
  // Already loaded or .env not found — ignore
}

import pg from "pg";
const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error(
    "\n❌  DATABASE_URL is not set. Paste your Neon.tech connection string into .env first.\n"
  );
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    console.log("🔌  Connected to database.");

    // ── Auth.js PostgreSQL adapter tables ──────────────────────────────────
    // Source: https://authjs.dev/getting-started/adapters/pg
    await client.query(`
      CREATE TABLE IF NOT EXISTS verification_token (
        identifier TEXT NOT NULL,
        expires     TIMESTAMPTZ NOT NULL,
        token       TEXT NOT NULL,
        PRIMARY KEY (identifier, token)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id                  TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "userId"            TEXT NOT NULL,
        type                TEXT NOT NULL,
        provider            TEXT NOT NULL,
        "providerAccountId" TEXT NOT NULL,
        refresh_token       TEXT,
        access_token        TEXT,
        expires_at          BIGINT,
        id_token            TEXT,
        scope               TEXT,
        session_state       TEXT,
        token_type          TEXT,
        PRIMARY KEY (provider, "providerAccountId")
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id             TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
        "userId"       TEXT NOT NULL,
        expires        TIMESTAMPTZ NOT NULL,
        "sessionToken" TEXT NOT NULL UNIQUE
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id             TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
        name           TEXT,
        email          TEXT UNIQUE,
        "emailVerified" TIMESTAMPTZ,
        image          TEXT,
        username       TEXT UNIQUE,
        bio            TEXT,
        avatar_url     TEXT,
        avatar_source  TEXT DEFAULT 'oauth',
        github_username TEXT,
        twitter_username TEXT,
        linkedin_url   TEXT,
        website_url    TEXT
      );
    `);

    // ── App progress table ─────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS progress (
        user_id           TEXT NOT NULL PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        completed         TEXT[]    NOT NULL DEFAULT '{}',
        quiz_scores       JSONB     NOT NULL DEFAULT '{}',
        challenges_passed JSONB     NOT NULL DEFAULT '{}',
        badges            TEXT[]    NOT NULL DEFAULT '{}',
        active_dates      JSONB     NOT NULL DEFAULT '[]',
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    console.log("✅  All tables ready.\n");
    console.log("   Tables created/verified:");
    console.log("     • users");
    console.log("     • accounts");
    console.log("     • sessions");
    console.log("     • verification_token");
    console.log("     • progress\n");
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("\n❌  Setup failed:", err.message, "\n");
  console.error(err);
  process.exit(1);
});
