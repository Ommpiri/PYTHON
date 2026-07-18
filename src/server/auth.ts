import Google from "@auth/core/providers/google";
import PostgresAdapter from "@auth/pg-adapter";
import { pool } from "./db";

const providers: any[] = [];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_ID !== "PASTE_YOUR_GOOGLE_CLIENT_ID_HERE") {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
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
  // Tell Auth.js the canonical URL so callbacks work correctly on Vercel
  ...(process.env.AUTH_URL ? { baseUrl: process.env.AUTH_URL } : {}),
  session: {
    strategy: "database" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    // Expose user.id in the session so server functions can read it
    session({ session, user }: { session: any; user: any }) {
      if (session.user && user?.id) {
        session.user.id = user.id;
      }
      return session;
    },
  },
};
