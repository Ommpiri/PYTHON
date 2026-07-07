import { createFileRoute, Link } from "@tanstack/react-router";
import { modules } from "@/lib/modules";
import { useProgress } from "@/hooks/useProgress";

export const Route = createFileRoute("/modules/")({
  head: () => ({
    meta: [
      { title: "All Modules — pycourse" },
      {
        name: "description",
        content: "All 12 modules of the Python Community Development course.",
      },
    ],
  }),
  component: ModulesIndex,
});

function ModulesIndex() {
  const p = useProgress();
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-6">
        <p className="font-mono text-xs text-amber"># dir(course)</p>
        <h1 className="mt-2 text-4xl font-display font-semibold mb-2">All modules</h1>
        <p className="text-muted-foreground font-mono text-sm">
          Select a module to begin or continue your progress.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-[oklch(0.15_0.02_240)] shadow-2xl overflow-hidden">
        {/* Terminal Header */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border font-mono text-xs text-muted-foreground">
          <span className="h-3 w-3 rounded-full bg-coral" />
          <span className="h-3 w-3 rounded-full bg-amber" />
          <span className="h-3 w-3 rounded-full bg-teal" />
          <span className="ml-3">pycourse — Python 3.12 REPL</span>
        </div>

        {/* Terminal Body */}
        <div className="p-4 sm:p-6 font-mono text-sm leading-relaxed text-warm-off">
          <div className="mb-4">
            <span className="text-amber">{">>> "}</span>
            <span>course.list_modules()</span>
          </div>

          <div className="space-y-1">
            {modules.map((m, i) => {
              const done = p.completed.includes(m.slug);
              return (
                <div key={m.id} className="flex flex-col sm:flex-row sm:items-baseline gap-2 group">
                  <Link
                    to="/modules/$slug"
                    params={{ slug: m.slug }}
                    className="flex-1 flex items-baseline hover:text-amber transition-colors"
                  >
                    <span className={`w-8 shrink-0 ${done ? "text-teal" : "text-amber"}`}>
                      {done ? "[✓]" : `[${m.id.toString().padStart(2, "0")}]`}
                    </span>
                    <span className="ml-2">{m.title}</span>
                  </Link>
                  <span className="text-xs text-muted-foreground hidden sm:block w-48 text-right group-hover:text-amber/70 transition-colors">
                    {m.tags.slice(0, 3).join(" · ")}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-6 text-amber">
            {">>> "}
            <span className="cursor-blink" />
          </div>
        </div>
      </div>
    </div>
  );
}
