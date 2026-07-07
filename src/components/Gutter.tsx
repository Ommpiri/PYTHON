import { Link } from "@tanstack/react-router";
import { modules } from "@/lib/modules";
import { useProgress } from "@/hooks/useProgress";

export function Gutter({ activeId }: { activeId?: number }) {
  const p = useProgress();
  return (
    <>
      {/* Desktop gutter */}
      <aside className="hidden md:flex gutter-col w-16 shrink-0 flex-col border-r border-border py-6 sticky top-14 self-start h-[calc(100vh-3.5rem)] overflow-y-auto font-mono">
        {modules.map((m) => {
          const active = m.id === activeId;
          const done = p.completed.includes(m.slug);
          return (
            <Link
              key={m.id}
              to="/modules/$slug"
              params={{ slug: m.slug }}
              title={`${m.id.toString().padStart(2, "0")} — ${m.title}`}
              className={`text-right pr-3 py-1.5 text-xs font-mono tabular-nums transition-colors ${
                active
                  ? "text-amber font-bold"
                  : done
                    ? "text-teal hover:text-amber"
                    : "hover:text-warm-off"
              }`}
            >
              {done ? "✓ " : "  "}
              {m.id.toString().padStart(2, "0")}
            </Link>
          );
        })}
      </aside>
      {/* Mobile strip */}
      <div className="md:hidden gutter-col border-b border-border overflow-x-auto font-mono">
        <div className="flex gap-1 px-3 py-2 min-w-max">
          {modules.map((m) => {
            const active = m.id === activeId;
            const done = p.completed.includes(m.slug);
            return (
              <Link
                key={m.id}
                to="/modules/$slug"
                params={{ slug: m.slug }}
                className={`text-xs px-2 py-1 rounded font-mono tabular-nums shrink-0 ${
                  active
                    ? "text-amber bg-secondary font-bold"
                    : done
                      ? "text-teal"
                      : "text-gutter-fg"
                }`}
              >
                {done ? "✓" : ""}
                {m.id.toString().padStart(2, "0")}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
