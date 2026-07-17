import { createServerFn } from "@tanstack/react-start";

export const migrateProgressFn = createServerFn({ method: "POST" })
  .validator((payload: {
    completed: string[];
    quizScores: Record<string, number>;
    challengesPassed: Record<string, number>;
    badges: string[];
  }) => payload)
  .handler(async ({ data }) => {
    const { getWebRequest } = await import("@tanstack/react-start/server");
    const req = getWebRequest();
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
        'INSERT INTO progress (user_id, completed, quiz_scores, challenges_passed, badges) VALUES ($1, $2, $3, $4, $5)',
        [
          userId,
          data.completed,
          JSON.stringify(data.quizScores),
          JSON.stringify(data.challengesPassed),
          data.badges,
        ]
      );
    }
    return { success: true };
  });


