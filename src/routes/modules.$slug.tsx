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
import { useEffect, useState, useCallback } from "react";
import { Flowchart } from "@/components/Flowchart";
import { IconBook, IconPlay, IconTerminal, IconGear, IconQuiz, IconDiscussion } from "@/components/CellIcons";

export const Route = createFileRoute("/modules/$slug")({
  loader: ({ params }) => {
    const mod = getModule(params.slug);
    if (!mod) throw notFound();
    return { mod };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Module not found — pycourse" }, { name: "robots", content: "noindex" }],
      };
    }
    const m = loaderData.mod;
    return {
      meta: [
        { title: `Module ${m.id.toString().padStart(2, "0")}: ${m.title} — pycourse` },
        {
          name: "description",
          content: `${m.title} — interactive Python module with live code, challenges, and a quiz.`,
        },
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
      <Link to="/modules" className="inline-block mt-4 text-amber">
        ← back to all modules
      </Link>
    </div>
  );
}

function ModulePage() {
  const { mod } = Route.useLoaderData();
  const p = useProgress();
  const done = p.completed.includes(mod.slug);

  // Warm up Pyodide as soon as the module page mounts
  useEffect(() => {
    preloadPyodide();
  }, []);

  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [visitedNodes, setVisitedNodes] = useState<string[]>([]);

  const handleTrace = useCallback(
    (lines: number[]) => {
      if (mod.id !== 3) return;
      setVisitedNodes([]);
      let i = 0;

      setActiveNode("start");

      setTimeout(() => {
        const timer = setInterval(() => {
          if (i >= lines.length) {
            clearInterval(timer);
            setActiveNode("end");
            setTimeout(() => setActiveNode(null), 1000);
            return;
          }

          const line = lines[i];
          let node = "body";
          if (line === 1) node = "condition";

          setActiveNode(node);
          setVisitedNodes((prev) => [...new Set([...prev, node])]);
          i++;
        }, 150);
      }, 300);
    },
    [mod.id],
  );

  const prev = modules.find((x) => x.id === mod.id - 1);
  const next = modules.find((x) => x.id === mod.id + 1);

  const downloadNotes = () => {
    const blob = new Blob(
      [`# Module ${mod.id} — ${mod.title}\n\n${mod.notes}\n\n---\n\n${mod.theory}\n`],
      { type: "text/markdown" },
    );
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
          <h1 className="mt-2 text-3xl sm:text-4xl font-display leading-tight">{mod.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {mod.tags.map((t: string) => (
              <span
                key={t}
                className="font-mono text-[11px] px-2 py-1 rounded bg-secondary text-secondary-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        </header>

        <Cell kind="in" label="theory.md" collapsible icon={<IconBook />}>
          <MarkdownBlock>{mod.theory}</MarkdownBlock>

          {mod.commonMistake && mod.commonMistake.length > 0 && (
            <div className="mt-6 mb-2 flex flex-col gap-3">
              {mod.commonMistake.map((gotcha: string, gi: number) => (
                <div key={gi} className="border-l-4 border-coral bg-coral/10 p-4 rounded-r-md">
                  <h4 className="font-display font-semibold text-coral text-sm uppercase tracking-wider mb-1">
                    {mod.commonMistake!.length === 1 ? "Common Mistake" : `Gotcha ${gi + 1}`}
                  </h4>
                  <p className="text-sm opacity-90 leading-relaxed text-warm-black">
                    {gotcha}
                  </p>
                </div>
              ))}
            </div>
          )}

          {mod.miniPrompt && (
            <div className="mt-4 p-4 rounded-md bg-warm-black/5 border border-black/5">
              <p className="text-sm italic opacity-90 text-warm-black">
                <span className="font-semibold text-teal not-italic">💡 Try this yourself: </span>
                {mod.miniPrompt}
              </p>
            </div>
          )}
        </Cell>

        <Cell kind="in" label={`live_coding — ${mod.liveCoding.title}`} icon={<IconPlay />}>
          {mod.liveCoding.note && (
            <p className="text-warm-black/70 mb-3 text-sm">{mod.liveCoding.note}</p>
          )}

          {mod.id === 3 && (
            <div className="mb-6 bg-[oklch(0.12_0.02_240)] p-4 rounded-md border border-white/5">
              <h4 className="font-display font-semibold text-amber text-sm mb-4 text-center">
                Interactive Control Flow Tracing
              </h4>
              <Flowchart kind="module3" activeNodeId={activeNode} visitedNodeIds={visitedNodes} />
            </div>
          )}
          {mod.id === 4 && (
            <div className="mb-6 bg-[oklch(0.12_0.02_240)] p-4 rounded-md border border-white/5">
              <h4 className="font-display font-semibold text-amber text-sm mb-4 text-center">
                Function Call Stack
              </h4>
              <Flowchart kind="module4" />
            </div>
          )}
          {mod.id === 6 && (
            <div className="mb-6 bg-[oklch(0.12_0.02_240)] p-4 rounded-md border border-white/5">
              <h4 className="font-display font-semibold text-amber text-sm mb-4 text-center">
                Exception Handling Paths
              </h4>
              <Flowchart kind="module6" />
            </div>
          )}
          {mod.id === 10 && (
            <div className="mb-6 bg-[oklch(0.12_0.02_240)] p-4 rounded-md border border-white/5">
              <h4 className="font-display font-semibold text-amber text-sm mb-4 text-center">
                Project Plan (Click nodes to edit)
              </h4>
              <Flowchart kind="module10" />
            </div>
          )}

          <CodeEditor
            starter={mod.liveCoding.starter}
            slug={mod.slug}
            cellKey="live"
            trace={mod.id === 3}
            onTrace={handleTrace}
          />
        </Cell>

        {mod.demo && (
          <Cell kind="out" label={`demo — ${mod.demo.description}`} icon={<IconTerminal />}>
            {mod.demo.kind === "install-check" && <InstallCheck />}
            {mod.demo.kind === "loop-visualizer" && <LoopVisualizer />}
            {mod.demo.kind === "ds-visualizer" && <DsVisualizer />}
            {mod.demo.kind === "generic" && (
              <p className="font-mono text-sm text-teal">{mod.demo.description}</p>
            )}
          </Cell>
        )}

        {mod.challenges.map((c: (typeof mod.challenges)[number], i: number) => (
          <Cell key={i} kind="in" label={`challenge_${i + 1}`} icon={<IconGear />}>
            <p className="text-warm-black mb-3">{c.prompt}</p>
            <CodeEditor
              starter={c.starter}
              expectedIncludes={c.expectedOutputIncludes}
              slug={mod.slug}
              cellKey={`challenge_${i + 1}`}
            />
          </Cell>
        ))}

        <Cell kind="in" label={`quiz — ${mod.quiz.length} questions`} icon={<IconQuiz />}>
          <QuizBlock slug={mod.slug} questions={mod.quiz} />
        </Cell>

        <Cell kind="in" label="discussion" icon={<IconDiscussion />}>
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

        {/* Further Reading Section */}
        {mod.furtherReading && mod.furtherReading.length > 0 && (
          <div className="mt-8 mb-6 p-6 rounded-md border border-border bg-background/50">
            <h3 className="font-display text-sm font-semibold mb-3 text-foreground/80 flex items-center gap-2">
              <span className="text-teal">#</span> further_reading
            </h3>
            <ul className="flex flex-col gap-2">
              {mod.furtherReading.map((link: { title: string; url: string }, i: number) => (
                <li key={i}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm font-mono text-muted-foreground hover:text-teal transition-colors"
                  >
                    <span className="text-teal/50 mr-2">↗</span>
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <nav className="mt-10 pt-6 border-t border-border flex justify-between font-mono text-xs">
          {prev ? (
            <Link
              to="/modules/$slug"
              params={{ slug: prev.slug }}
              className="text-muted-foreground hover:text-amber"
            >
              ← {prev.id.toString().padStart(2, "0")} · {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              to="/modules/$slug"
              params={{ slug: next.slug }}
              className="text-muted-foreground hover:text-amber text-right"
            >
              {next.id.toString().padStart(2, "0")} · {next.title} →
            </Link>
          ) : (
            <Link to="/certificate" className="text-teal">
              get certificate →
            </Link>
          )}
        </nav>
      </article>
    </div>
  );
}
