import Google from "@auth/core/providers/google";
import PostgresAdapter from "@auth/pg-adapter";
import { pool } from "./db";

const providers: any[] = [];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_ID !== "PASTE_YOUR_GOOGLE_CLIENT_ID_HERE") {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID.trim(),
      clientSecret: process.env.AUTH_GOOGLE_SECRET?.trim() || "",
    })
  );
}

if (providers.length === 0) {
  console.warn(
    "[auth] ⚠️  No providers configured. Set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET in .env"
  );
}

export const authConfig = {
  providers,
  adapter: PostgresAdapter(pool),
  secret: process.env.AUTH_SECRET || "default_secret_for_development",
  trustHost: true,
  basePath: "/api/auth",
  // trustHost: true allows Vercel's proxy headers. AUTH_URL env var is read automatically.
  session: {
    strategy: "database" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    // Expose user.id and username in the session so server functions can read it
    async session({ session, user }: { session: any; user: any }) {
      if (session.user && user?.id) {
        session.user.id = user.id;
        try {
          const res = await pool.query('SELECT username, onboarding_completed FROM users WHERE id = $1', [user.id]);
          if (res.rows[0]) {
            session.user.username = res.rows[0].username;
            session.user.onboarding_completed = res.rows[0].onboarding_completed;
          }
        } catch (e) {
          console.error("Failed to fetch username for session", e);
        }
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      try {
        let baseSlug = "user";
        if (user.name) {
          baseSlug = user.name.toLowerCase().replace(/[^a-z0-9_-]/g, "");
        } else if (user.email) {
          baseSlug = user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_-]/g, "");
        }
        
        // Ensure constraints: 3-20 chars
        baseSlug = baseSlug.slice(0, 20);
        if (baseSlug.length < 3) baseSlug = baseSlug.padEnd(3, "0");
        
        let suffix = "";
        let finalUsername = baseSlug;
        let counter = 1;
        
        while (true) {
          const check = await pool.query("SELECT id FROM users WHERE username = $1", [finalUsername]);
          if (check.rows.length === 0) break;
          suffix = String(counter);
          finalUsername = baseSlug.slice(0, 20 - suffix.length) + suffix;
          counter++;
        }
        
        await pool.query(
          "UPDATE users SET username = $1, avatar_url = $2, avatar_source = 'oauth' WHERE id = $3",
          [finalUsername, user.image, user.id]
        );
      } catch (err) {
        console.error("Failed to provision username for new user", err);
      }
    }
  }
};
