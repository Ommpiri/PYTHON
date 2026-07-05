import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { modules } from "@/lib/modules";

// Terminal that boots the course on load. Respects prefers-reduced-motion.
type Line =
  | { kind: "prompt"; text: string }
  | { kind: "sys"; text: string }
  | { kind: "module"; idx: number; text: string };

export function TerminalHero() {
  const script = useMemo<Line[]>(
    () => [
      { kind: "prompt", text: "import course" },
      { kind: "prompt", text: 'course.load("Python Community Development")' },
      { kind: "sys", text: "Loading modules..." },
      ...modules.map<Line>((m, i) => ({
        kind: "module",
        idx: i,
        text: `  [${m.id.toString().padStart(2, "0")}]  ${m.title}`,
      })),
      { kind: "sys", text: "Ready. Type >>> to begin." },
    ],
    [],
  );

  const reduced = useReducedMotion();
  const [visibleCount, setVisibleCount] = useState(reduced ? script.length : 0);
  const [charProgress, setCharProgress] = useState(0);
  const cancelled = useRef(false);

  useEffect(() => {
    if (reduced) return;
    cancelled.current = false;
    let line = 0;
    let ch = 0;
    const tick = () => {
      if (cancelled.current) return;
      const current = script[line];
      if (!current) return;
      if (ch < current.text.length) {
        ch += Math.max(1, Math.floor(current.text.length / 40));
        setCharProgress(ch);
        setTimeout(tick, current.kind === "module" ? 12 : 18);
      } else {
        line += 1;
        setVisibleCount(line);
        ch = 0;
        setCharProgress(0);
        if (line < script.length) setTimeout(tick, current.kind === "module" ? 90 : 220);
      }
    };
    const start = setTimeout(tick, 350);
    return () => {
      cancelled.current = true;
      clearTimeout(start);
    };
  }, [reduced, script]);

  const skip = () => setVisibleCount(script.length);

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-14 pb-10">
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-amber">python 3.12 · REPL</p>
          <h1 className="mt-2 text-4xl sm:text-6xl font-display font-semibold leading-[1.05]">
            A 12-module Python course
            <br />
            <span className="italic text-amber">that runs in the terminal you're reading.</span>
          </h1>
        </div>
        <button
          onClick={skip}
          className="font-mono text-xs text-muted-foreground hover:text-amber shrink-0"
        >
          skip →
        </button>
      </div>

      <div className="rounded-lg border border-border bg-[oklch(0.15_0.02_240)] shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border font-mono text-xs text-muted-foreground">
          <span className="h-3 w-3 rounded-full bg-coral" />
          <span className="h-3 w-3 rounded-full bg-amber" />
          <span className="h-3 w-3 rounded-full bg-teal" />
          <span className="ml-3">pycourse — Python 3.12 REPL</span>
        </div>
        <div className="p-4 sm:p-6 font-mono text-sm leading-relaxed min-h-[420px]">
          {script.map((l, i) => {
            if (i > visibleCount) return null;
            const isCurrent = i === visibleCount && !reduced;
            const text = isCurrent ? l.text.slice(0, charProgress) : l.text;
            if (l.kind === "prompt") {
              return (
                <div key={i} className="text-warm-off">
                  <span className="text-amber">{">>> "}</span>
                  <span>{text}</span>
                  {isCurrent ? <span className="cursor-blink" /> : null}
                </div>
              );
            }
            if (l.kind === "sys") {
              return (
                <div key={i} className="text-muted-foreground">
                  {text}
                  {isCurrent ? <span className="cursor-blink" /> : null}
                </div>
              );
            }
            const mod = modules[l.idx];
            return (
              <Link
                key={i}
                to="/modules/$slug"
                params={{ slug: mod.slug }}
                className="block text-warm-off hover:text-amber transition-colors"
              >
                {text}
                {isCurrent ? <span className="cursor-blink" /> : null}
              </Link>
            );
          })}
          {visibleCount >= script.length && (
            <div className="mt-3 text-amber">
              {">>> "}
              <span className="cursor-blink" />
            </div>
          )}
        </div>
      </div>

      {/* CTA — fades in once the terminal is fully typed */}
      {visibleCount >= script.length && (
        <div className="mt-6 flex flex-wrap gap-3 items-center animate-fade-in">
          <Link
            to="/modules/$slug"
            params={{ slug: "intro" }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-amber text-primary-foreground font-mono text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            start_course()
          </Link>
          <Link
            to="/modules"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded border border-border font-mono text-sm text-muted-foreground hover:border-amber hover:text-amber transition-colors"
          >
            browse_modules()
          </Link>
        </div>
      )}
    </section>
  );
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const h = () => setReduced(mq.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return reduced;
}
