import { createServerFn } from "@tanstack/react-start";

export const migrateProgressFn = createServerFn({ method: "POST" })
  .validator((payload: {
    completed: string[];
    quizScores: Record<string, number>;
    challengesPassed: Record<string, number>;
    badges: string[];
    activeDates?: string[];
  }) => payload)
  .handler(async ({ data }) => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const req = getRequest();
    if (!req) throw new Error("Unauthorized");
    
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/(?:^|;\s*)(?:__Secure-)?authjs\.session-token=([^;]+)/);
    if (!match) throw new Error("Unauthorized");
    
    const token = match[1];
    const { pool } = await import("../server/db");
    
    const sessionResult = await pool.query('SELECT "userId" FROM sessions WHERE "sessionToken" = $1 AND expires > now()', [token]);
    const userId = sessionResult.rows[0]?.userId;
    if (!userId) throw new Error("Unauthorized");

    // Check if progress already exists for this user
    const existing = await pool.query('SELECT 1 FROM progress WHERE user_id = $1', [userId]);
    if (existing.rows.length === 0) {
      await pool.query(
        'INSERT INTO progress (user_id, completed, quiz_scores, challenges_passed, badges, active_dates) VALUES ($1, $2, $3, $4, $5, $6)',
        [
          userId,
          data.completed,
          JSON.stringify(data.quizScores),
          JSON.stringify(data.challengesPassed),
          data.badges,
          JSON.stringify(data.activeDates || [])
        ]
      );
    }
    return { success: true };
  });

export const getProgressFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const req = getRequest();
    if (!req) return null;
    
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/(?:^|;\s*)(?:__Secure-)?authjs\.session-token=([^;]+)/);
    if (!match) return null;
    
    const token = match[1];
    const { pool } = await import("../server/db");
    
    const sessionResult = await pool.query('SELECT "userId" FROM sessions WHERE "sessionToken" = $1 AND expires > now()', [token]);
    const userId = sessionResult.rows[0]?.userId;
    if (!userId) return null;

    const existing = await pool.query('SELECT completed, quiz_scores, challenges_passed, badges, active_dates FROM progress WHERE user_id = $1', [userId]);
    if (existing.rows.length === 0) return null;

    const row = existing.rows[0];
    return {
      completed: row.completed || [],
      quizScores: row.quiz_scores || {},
      challengesPassed: row.challenges_passed || {},
      badges: row.badges || [],
      activeDates: row.active_dates || [],
    };
  });

export const updateProgressFn = createServerFn({ method: "POST" })
  .validator((payload: {
    completed: string[];
    quizScores: Record<string, number>;
    challengesPassed: Record<string, number>;
    badges: string[];
    activeDates?: string[];
  }) => payload)
  .handler(async ({ data }) => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const req = getRequest();
    if (!req) throw new Error("Unauthorized");
    
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/(?:^|;\s*)(?:__Secure-)?authjs\.session-token=([^;]+)/);
    if (!match) throw new Error("Unauthorized");
    
    const token = match[1];
    const { pool } = await import("../server/db");
    
    const sessionResult = await pool.query('SELECT "userId" FROM sessions WHERE "sessionToken" = $1 AND expires > now()', [token]);
    const userId = sessionResult.rows[0]?.userId;
    if (!userId) throw new Error("Unauthorized");

    await pool.query(
      `INSERT INTO progress (user_id, completed, quiz_scores, challenges_passed, badges, active_dates, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, now()) 
       ON CONFLICT (user_id) DO UPDATE SET 
       completed = EXCLUDED.completed,
       quiz_scores = EXCLUDED.quiz_scores,
       challenges_passed = EXCLUDED.challenges_passed,
       badges = EXCLUDED.badges,
       active_dates = EXCLUDED.active_dates,
       updated_at = now()`,
      [
        userId,
        data.completed,
        JSON.stringify(data.quizScores),
        JSON.stringify(data.challengesPassed),
        data.badges,
        JSON.stringify(data.activeDates || [])
      ]
    );
    return { success: true };
  });

