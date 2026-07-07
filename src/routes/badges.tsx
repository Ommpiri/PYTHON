import { createFileRoute } from "@tanstack/react-router";
import { badgeDefs } from "@/lib/progress";
import { useProgress } from "@/hooks/useProgress";
import { modules } from "@/lib/modules";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/badges")({
  head: () => ({
    meta: [
      { title: "Badges — pycourse" },
      { name: "description", content: "Achievements unlocked as you progress through the course." },
    ],
  }),
  component: BadgesPage,
});

// Unlock hint & progress for each badge
const unlockHints: Record<
  string,
  {
    hint: string;
    getProgress?: (p: ReturnType<typeof useProgress>) => { current: number; total: number };
  }
> = {
  "first-run": {
    hint: "Run your first Python program in any challenge editor.",
    getProgress: (p) => ({
      current: Math.min(
        Object.values(p.challengesPassed).reduce((a, x) => a + x, 0),
        1,
      ),
      total: 1,
    }),
  },
  "quiz-master": {
    hint: "Score 100% on any 3 quizzes.",
    getProgress: (p) => ({
      current: Object.values(p.quizScores).filter((v) => v >= 100).length,
      total: 3,
    }),
  },
  "half-way": {
    hint: "Complete 6 out of 12 modules.",
    getProgress: (p) => ({ current: p.completed.length, total: 6 }),
  },
  capstone: {
    hint: "Complete all 12 modules.",
    getProgress: (p) => ({ current: p.completed.length, total: modules.length }),
  },
  challenger: {
    hint: "Pass a total of 5 challenge editors.",
    getProgress: (p) => ({
      current: Object.values(p.challengesPassed).reduce((a, x) => a + x, 0),
      total: 5,
    }),
  },
};

function BadgesPage() {
  const p = useProgress();
  const unlockedCount = badgeDefs.filter((b) => p.badges.includes(b.id)).length;

  // Track newly-unlocked badges for the flip animation.
  // Initialised to the current badge list so page-load doesn't animate everything.
  const prevBadgesRef = useRef<string[]>(p.badges);
  const [justUnlocked, setJustUnlocked] = useState<Set<string>>(new Set());

  useEffect(() => {
    const prev = prevBadgesRef.current;
    const newBadges = p.badges.filter((b) => !prev.includes(b));
    prevBadgesRef.current = p.badges;
    if (newBadges.length === 0) return;

    setJustUnlocked((s) => new Set([...s, ...newBadges]));
    const timer = setTimeout(() => {
      setJustUnlocked((s) => {
        const next = new Set(s);
        newBadges.forEach((b) => next.delete(b));
        return next;
      });
    }, 700);
    return () => clearTimeout(timer);
  }, [p.badges]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <p className="font-mono text-xs text-amber"># achievements.list()</p>
      <h1 className="mt-2 text-4xl font-display">Badges</h1>
      <p className="mt-2 text-muted-foreground max-w-xl">
        No gold circles. Just tags — the way you'd label a release.
      </p>
      <p className="mt-1 font-mono text-xs text-muted-foreground">
        {unlockedCount} / {badgeDefs.length} unlocked
      </p>

      <div className="mt-8 grid sm:grid-cols-2 gap-3">
        {badgeDefs.map((b) => {
          const unlocked = p.badges.includes(b.id);
          const hint = unlockHints[b.id];
          const prog = hint?.getProgress?.(p);

          return (
            <div
              key={b.id}
              className={`p-4 rounded-lg border font-mono text-sm transition-all duration-300 ${
                unlocked
                  ? `border-teal bg-teal/5 shadow-[0_0_14px_oklch(0.66_0.08_175_/_0.25)] ${
                      justUnlocked.has(b.id) ? "animate-badge-unlock" : ""
                    }`
                  : "border-border hover:border-border/80"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className={`text-base ${unlocked ? "text-teal" : "text-muted-foreground"}`}>
                  #{b.label}
                </span>
                <span
                  className={`text-xs shrink-0 ${unlocked ? "text-teal" : "text-muted-foreground"}`}
                >
                  [{unlocked ? "✓ unlocked" : "locked"}]
                </span>
              </div>

              <p className="mt-2 text-foreground/80 font-sans text-sm">{b.desc}</p>

              {!unlocked && hint && (
                <p className="mt-2 text-xs text-muted-foreground font-sans">→ {hint.hint}</p>
              )}

              {!unlocked && prog && (
                <div className="mt-3">
                  <div className="flex justify-between font-mono text-[10px] text-muted-foreground mb-1">
                    <span>progress</span>
                    <span>
                      {Math.min(prog.current, prog.total)} / {prog.total}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-amber transition-all duration-500"
                      style={{ width: `${Math.min((prog.current / prog.total) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {unlocked && (
                <div className="mt-3 h-1.5 rounded-full bg-teal/30 overflow-hidden">
                  <div className="h-full bg-teal w-full" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
