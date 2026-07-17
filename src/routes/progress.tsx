import { createFileRoute, Link } from "@tanstack/react-router";
import { modules } from "@/lib/modules";
import { useProgress } from "@/hooks/useProgress";
import { calculateStreak } from "@/lib/progress";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "My Progress — pycourse" },
      { name: "description", content: "Track your 12-module progress and quiz scores." },
    ],
  }),
  component: ProgressPage,
});

/** 12 terminal-block segments that stagger-animate in and show a blinking
 *  cursor at the first pending position. */
function TerminalProgress({ completedSlugs }: { completedSlugs: string[] }) {
  const firstPendingIdx = modules.findIndex((m) => !completedSlugs.includes(m.slug));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-0.5 font-mono text-base leading-none select-none">
        {modules.map((m, i) => {
          const isDone = completedSlugs.includes(m.slug);
          const isCursor = i === firstPendingIdx;
          return (
            <span
              key={m.id}
              title={`${m.id.toString().padStart(2, "0")} — ${m.title}`}
              style={{ animationDelay: `${i * 45}ms` }}
              className={`inline-block animate-block-appear ${
                isDone
                  ? "text-amber"
                  : isCursor
                    ? "text-amber animate-char-blink"
                    : "text-muted-foreground/25"
              }`}
            >
              {isDone ? "█" : isCursor ? "▊" : "░"}
            </span>
          );
        })}
      </div>
      <p className="mt-3 font-mono text-xs text-muted-foreground">
        {completedSlugs.length} / {modules.length} modules —{" "}
        {Math.round((completedSlugs.length / modules.length) * 100)}% complete
      </p>
    </div>
  );
}

function ProgressPage() {
  const p = useProgress();

  const done = modules.filter((m) => p.completed.includes(m.slug));
  const pending = modules.filter((m) => !p.completed.includes(m.slug));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <p className="font-mono text-xs text-amber"># progress.status()</p>
      <h1 className="mt-2 text-4xl font-display">My progress</h1>

      <div className="mt-6 rounded-lg border border-border p-6 bg-secondary">
        <div className="flex items-baseline justify-between font-mono text-sm mb-2 pb-2 border-b border-border/10">
          <span>completed</span>
          <span className="text-amber font-semibold">
            {p.completed.length} / {modules.length}
          </span>
        </div>
        <div className="flex items-baseline justify-between font-mono text-sm mb-4">
          <span>streak</span>
          <span className="text-amber font-semibold flex items-center gap-1">
            🔥 {calculateStreak(p.activeDates)} days active
          </span>
        </div>
        <TerminalProgress completedSlugs={p.completed} />
      </div>

      {/* Completed modules */}
      {done.length > 0 && (
        <div className="mt-8">
          <p className="font-mono text-xs text-teal mb-3"># completed({done.length})</p>
          <div className="space-y-2">
            {done.map((m) => {
              const score = p.quizScores[m.slug];
              const challenges = p.challengesPassed[m.slug] ?? 0;
              return (
                <Link
                  key={m.id}
                  to="/modules/$slug"
                  params={{ slug: m.slug }}
                  className="flex items-center gap-4 p-3 border border-teal/30 bg-teal/5 rounded hover:border-teal transition-colors group"
                >
                  <span className="font-mono w-8 text-right tabular-nums text-teal shrink-0">
                    ✓ {m.id.toString().padStart(2, "0")}
                  </span>
                  <span className="flex-1 truncate group-hover:text-teal transition-colors">
                    {m.title}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground shrink-0">
                    {score !== undefined ? `quiz ${score}%` : "quiz —"} · runs {challenges}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending modules */}
      {pending.length > 0 && (
        <div className="mt-6">
          <p className="font-mono text-xs text-muted-foreground mb-3">
            # pending({pending.length})
          </p>
          <div className="space-y-2">
            {pending.map((m) => {
              const score = p.quizScores[m.slug];
              const challenges = p.challengesPassed[m.slug] ?? 0;
              return (
                <Link
                  key={m.id}
                  to="/modules/$slug"
                  params={{ slug: m.slug }}
                  className="flex items-center gap-4 p-3 border border-border rounded hover:border-amber transition-colors group"
                >
                  <span className="font-mono w-8 text-right tabular-nums text-muted-foreground shrink-0">
                    ○ {m.id.toString().padStart(2, "0")}
                  </span>
                  <span className="flex-1 truncate group-hover:text-amber transition-colors">
                    {m.title}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground shrink-0">
                    {score !== undefined ? `quiz ${score}%` : "quiz —"} · runs {challenges}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {p.completed.length === 0 && (
        <p className="mt-8 font-mono text-sm text-muted-foreground">
          {">>> "}no modules completed yet.{" "}
          <Link to="/modules" className="text-amber hover:underline">
            start_course()
          </Link>
        </p>
      )}
    </div>
  );
}
