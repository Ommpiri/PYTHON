import { createFileRoute, Link } from "@tanstack/react-router";
import { modules } from "@/lib/modules";
import { useProgress } from "@/hooks/useProgress";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "My Progress — pycourse" },
      { name: "description", content: "Track your 12-module progress and quiz scores." },
    ],
  }),
  component: ProgressPage,
});

function AnimatedBar({ pct }: { pct: number }) {
  const [width, setWidth] = useState(0);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      // Delay so transition plays on first render
      const id = setTimeout(() => setWidth(pct), 100);
      return () => clearTimeout(id);
    } else {
      setWidth(pct);
    }
  }, [pct]);

  return (
    <div className="h-3 rounded-full bg-background overflow-hidden">
      <div
        className="h-full bg-amber rounded-full transition-all duration-700 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function ProgressPage() {
  const p = useProgress();
  const pct = Math.round((p.completed.length / modules.length) * 100);

  const done = modules.filter((m) => p.completed.includes(m.slug));
  const pending = modules.filter((m) => !p.completed.includes(m.slug));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <p className="font-mono text-xs text-amber"># progress.status()</p>
      <h1 className="mt-2 text-4xl font-display">My progress</h1>

      <div className="mt-6 rounded-lg border border-border p-6 bg-secondary">
        <div className="flex items-baseline justify-between font-mono text-sm mb-3">
          <span>completed</span>
          <span className="text-amber">
            {p.completed.length} / {modules.length}
          </span>
        </div>
        <AnimatedBar pct={pct} />
        <p className="mt-2 font-mono text-xs text-muted-foreground">{pct}% complete</p>
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
