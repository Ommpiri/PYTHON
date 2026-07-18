import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const profileSchema = z.object({
  username: z.string().regex(/^[a-z0-9_-]{3,20}$/, "Username must be 3-20 characters (a-z, 0-9, _, -)"),
  bio: z.string().max(160, "Bio max 160 characters").optional(),
  avatar_url: z.string().optional(),
  avatar_source: z.enum(["oauth", "github", "preset", "upload"]).default("oauth"),
  github_username: z.string().optional().nullable(),
  twitter_username: z.string().optional().nullable(),
  linkedin_url: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
  website_url: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
});

// Reuse authentication check pattern from progress.ts
async function getUserIdFromCookie() {
  const { getRequest } = await import("@tanstack/react-start/server");
  const req = getRequest();
  if (!req) return null;
  
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)(?:__Secure-)?authjs\.session-token=([^;]+)/);
  if (!match) return null;
  
  const token = match[1];
  const { pool } = await import("../server/db");
  
  const sessionResult = await pool.query('SELECT "userId" FROM sessions WHERE "sessionToken" = $1 AND expires > now()', [token]);
  return sessionResult.rows[0]?.userId || null;
}

export const getProfileFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const userId = await getUserIdFromCookie();
    if (!userId) throw new Error("Unauthorized");
    
    const { pool } = await import("../server/db");
    const res = await pool.query(
      "SELECT id, name, email, image, username, bio, avatar_url, avatar_source, github_username, twitter_username, linkedin_url, website_url, onboarding_completed FROM users WHERE id = $1",
      [userId]
    );
    
    return res.rows[0] || null;
  });

export const updateProfileFn = createServerFn({ method: "POST" })
  .validator(profileSchema)
  .handler(async ({ data }) => {
    const userId = await getUserIdFromCookie();
    if (!userId) throw new Error("Unauthorized");
    
    const { pool } = await import("../server/db");
    
    // Check username uniqueness
    const check = await pool.query("SELECT id FROM users WHERE username = $1 AND id != $2", [data.username, userId]);
    if (check.rows.length > 0) {
      throw new Error("Username already taken");
    }

    await pool.query(
      `UPDATE users SET 
        username = $1, 
        bio = $2, 
        avatar_url = $3, 
        avatar_source = $4, 
        github_username = $5, 
        twitter_username = $6, 
        linkedin_url = $7, 
        website_url = $8,
        onboarding_completed = true
       WHERE id = $9`,
      [
        data.username,
        data.bio || "",
        data.avatar_url || "",
        data.avatar_source,
        data.github_username || null,
        data.twitter_username || null,
        data.linkedin_url || null,
        data.website_url || null,
        userId
      ]
    );
    
    return { success: true };
  });

export const checkUsernameFn = createServerFn({ method: "GET" })
  .validator((d: { username: string }) => d)
  .handler(async ({ data }) => {
    const userId = await getUserIdFromCookie();
    if (!userId) throw new Error("Unauthorized");
    
    const { pool } = await import("../server/db");
    const check = await pool.query("SELECT id FROM users WHERE username = $1 AND id != $2", [data.username, userId]);
    
    return { available: check.rows.length === 0 };
  });

export const getPublicProfileFn = createServerFn({ method: "GET" })
  .validator((d: { username: string }) => d)
  .handler(async ({ data }) => {
    const { pool } = await import("../server/db");
    
    const userRes = await pool.query(
      "SELECT id, name, username, bio, avatar_url, avatar_source, github_username, twitter_username, linkedin_url, website_url FROM users WHERE username = $1",
      [data.username]
    );
    
    if (userRes.rows.length === 0) {
      return null;
    }
    
    const user = userRes.rows[0];
    
    // Get progress stats for this user
    const progressRes = await pool.query(
      "SELECT completed, challenges_passed, badges, active_dates FROM progress WHERE user_id = $1",
      [user.id]
    );
    
    const progress = progressRes.rows[0] || { completed: [], challenges_passed: {}, badges: [], active_dates: [] };
    
    return {
      user,
      progress: {
        completedCount: progress.completed?.length || 0,
        challengesCount: Object.values(progress.challenges_passed || {}).reduce((a: any, b: any) => a + b, 0),
        badges: progress.badges || [],
        activeDates: progress.active_dates || [],
      }
    };
  });

export const validateGithubUsernameFn = createServerFn({ method: "POST" })
  .validator((d: { username: string }) => d)
  .handler(async ({ data }) => {
    try {
      const res = await fetch(`https://api.github.com/users/${data.username}`, {
        headers: { "User-Agent": "pycourse-app" }
      });
      
      if (!res.ok) {
        return { valid: false, error: res.status === 404 ? "Not found" : "Rate limited" };
      }
      
      const githubUser = await res.json();
      return { 
        valid: true, 
        repos: githubUser.public_repos 
      };
    } catch (e) {
      return { valid: false, error: "Network error" };
    }
  });
