import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getModule, modules } from "@/lib/modules";
import { Gutter } from "@/components/Gutter";
import { Cell } from "@/components/Cell";
import { CodeEditor } from "@/components/CodeEditor";
import { QuizBlock } from "@/components/QuizBlock";
import { CommentThread } from "@/components/CommentThread";
import { InstallCheck, LoopVisualizer, DsVisualizer } from "@/components/Demos";
import { markComplete, unmarkComplete } from "@/lib/progress";
import { useProgress } from "@/hooks/useProgress";
import { MarkdownBlock } from "@/components/MarkdownBlock";
import { preloadPyodide } from "@/lib/pyodide-runner";
import { useEffect } from "react";

export const Route = createFileRoute("/modules/$slug")({
  loader: ({ params }) => {
    const mod = getModule(params.slug);
    if (!mod) throw notFound();
    return { mod };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Module not found — pycourse" }, { name: "robots", content: "noindex" }] };
    }
    const m = loaderData.mod;
    return {
      meta: [
        { title: `Module ${m.id.toString().padStart(2, "0")}: ${m.title} — pycourse` },
        { name: "description", content: `${m.title} — interactive Python module with live code, challenges, and a quiz.` },
        { property: "og:title", content: `${m.title} — pycourse module ${m.id}` },
        { property: "og:description", content: m.theory.slice(0, 160) },
      ],
    };
  },
  component: ModulePage,
  notFoundComponent: ModuleNotFound,
});

function ModuleNotFound() {
  return (
    <div className="max-w-xl mx-auto px-6 py-20 text-center font-mono">
      <p className="text-coral">ModuleNotFoundError: no such module</p>
      <Link to="/modules" className="inline-block mt-4 text-amber">← back to all modules</Link>
    </div>
  );
}

function ModulePage() {
  const { mod } = Route.useLoaderData();
  const p = useProgress();
  const done = p.completed.includes(mod.slug);

  // Warm up Pyodide as soon as the module page mounts
  useEffect(() => { preloadPyodide(); }, []);

  const prev = modules.find(x => x.id === mod.id - 1);
  const next = modules.find(x => x.id === mod.id + 1);

  const downloadNotes = () => {
    const blob = new Blob([`# Module ${mod.id} — ${mod.title}\n\n${mod.notes}\n\n---\n\n${mod.theory}\n`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `module-${mod.id.toString().padStart(2, "0")}-${mod.slug}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex">
      <Gutter activeId={mod.id} />
      <article className="flex-1 min-w-0 px-4 sm:px-8 py-8 max-w-4xl">
        <header className="mb-8">
          <p className="font-mono text-xs text-amber">
            module_{mod.id.toString().padStart(2, "0")}.py
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-display leading-tight">
            {mod.title}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {mod.tags.map((t: string) => (
              <span key={t} className="font-mono text-[11px] px-2 py-1 rounded bg-secondary text-secondary-foreground">
                {t}
              </span>
            ))}
          </div>
        </header>

        <Cell kind="in" label="theory.md" collapsible>
          <MarkdownBlock>{mod.theory}</MarkdownBlock>
        </Cell>

        <Cell kind="in" label={`live_coding — ${mod.liveCoding.title}`}>
          {mod.liveCoding.note && (
            <p className="text-warm-black/70 mb-3 text-sm">{mod.liveCoding.note}</p>
          )}
          <CodeEditor starter={mod.liveCoding.starter} slug={mod.slug} cellKey="live" />
        </Cell>

        {mod.demo && (
          <Cell kind="out" label={`demo — ${mod.demo.description}`}>
            {mod.demo.kind === "install-check" && <InstallCheck />}
            {mod.demo.kind === "loop-visualizer" && <LoopVisualizer />}
            {mod.demo.kind === "ds-visualizer" && <DsVisualizer />}
            {mod.demo.kind === "generic" && (
              <p className="font-mono text-sm text-teal">{mod.demo.description}</p>
            )}
          </Cell>
        )}

        {mod.challenges.map((c: typeof mod.challenges[number], i: number) => (
          <Cell key={i} kind="in" label={`challenge_${i + 1}`}>
            <p className="text-warm-black mb-3">{c.prompt}</p>
            <CodeEditor
              starter={c.starter}
              expectedIncludes={c.expectedOutputIncludes}
              slug={mod.slug}
              cellKey={`challenge_${i + 1}`}
            />
          </Cell>
        ))}

        <Cell kind="in" label={`quiz — ${mod.quiz.length} questions`}>
          <QuizBlock slug={mod.slug} questions={mod.quiz} />
        </Cell>

        <Cell kind="in" label="discussion">
          <CommentThread slug={mod.slug} />
        </Cell>

        <div className="my-8 flex flex-wrap gap-3 items-center justify-between">
          <button
            onClick={downloadNotes}
            className="font-mono text-xs px-3 py-2 rounded border border-border hover:border-amber"
          >
            ⬇ download_notes.md
          </button>
          <button
            onClick={() => (done ? unmarkComplete(mod.slug) : markComplete(mod.slug))}
            className={`font-mono text-xs px-4 py-2 rounded font-semibold ${
              done ? "bg-teal text-warm-off" : "bg-amber text-primary-foreground"
            }`}
          >
            {done ? "✓ module_complete — undo?" : "mark_module_complete()"}
          </button>
        </div>

        <nav className="mt-10 pt-6 border-t border-border flex justify-between font-mono text-xs">
          {prev ? (
            <Link to="/modules/$slug" params={{ slug: prev.slug }} className="text-muted-foreground hover:text-amber">
              ← {prev.id.toString().padStart(2, "0")} · {prev.title}
            </Link>
          ) : <span />}
          {next ? (
            <Link to="/modules/$slug" params={{ slug: next.slug }} className="text-muted-foreground hover:text-amber text-right">
              {next.id.toString().padStart(2, "0")} · {next.title} →
            </Link>
          ) : <Link to="/certificate" className="text-teal">get certificate →</Link>}
        </nav>
      </article>
    </div>
  );
}
