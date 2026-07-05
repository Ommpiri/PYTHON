import { createFileRoute, Link } from "@tanstack/react-router";
import { modules } from "@/lib/modules";
import { useProgress } from "@/hooks/useProgress";

export const Route = createFileRoute("/modules/")({
  head: () => ({
    meta: [
      { title: "All Modules — pycourse" },
      { name: "description", content: "All 12 modules of the Python Community Development course." },
    ],
  }),
  component: ModulesIndex,
});

function ModulesIndex() {
  const p = useProgress();
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <p className="font-mono text-xs text-amber"># dir(course)</p>
      <h1 className="mt-2 text-4xl font-display mb-8">All modules</h1>
      <ol className="space-y-2">
        {modules.map(m => {
          const done = p.completed.includes(m.slug);
          return (
            <li key={m.id}>
              <Link
                to="/modules/$slug"
                params={{ slug: m.slug }}
                className="flex items-baseline gap-4 p-4 border border-border rounded hover:border-amber transition-colors"
              >
                <span className={`font-mono tabular-nums ${done ? "text-teal" : "text-amber"}`}>
                  {done ? "✓" : " "} {m.id.toString().padStart(2, "0")}
                </span>
                <span className="font-display text-lg flex-1">{m.title}</span>
                <span className="font-mono text-xs text-muted-foreground hidden sm:block">
                  {m.tags.slice(0, 3).join(" · ")}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
