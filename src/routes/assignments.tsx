import { createFileRoute, Link } from "@tanstack/react-router";
import { modules } from "@/lib/modules";

export const Route = createFileRoute("/assignments")({
  head: () => ({ meta: [{ title: "Assignments — pycourse" }, { name: "description", content: "All practice challenges and mini-projects across the 12 modules." }] }),
  component: AssignmentsPage,
});

function AssignmentsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <p className="font-mono text-xs text-amber"># assignments.all()</p>
      <h1 className="mt-2 text-4xl font-display">Assignments</h1>
      <p className="mt-2 text-muted-foreground max-w-2xl">
        Every practice challenge across the twelve modules. Click through to attempt in the live editor.
      </p>

      <div className="mt-8 space-y-6">
        {modules.map(m => (
          <div key={m.id} className="border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-secondary font-mono text-xs flex items-center justify-between">
              <span className="text-amber">
                module_{m.id.toString().padStart(2, "0")} · {m.title}
              </span>
              <Link to="/modules/$slug" params={{ slug: m.slug }} className="text-muted-foreground hover:text-amber">
                open →
              </Link>
            </div>
            <ol className="divide-y divide-border">
              {m.challenges.map((c, i) => (
                <li key={i} className="p-4">
                  <p className="font-mono text-xs text-muted-foreground">challenge_{i + 1}</p>
                  <p className="mt-1">{c.prompt}</p>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}
