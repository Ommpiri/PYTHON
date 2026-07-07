import { createFileRoute, Link } from "@tanstack/react-router";
import { TerminalHero } from "@/components/TerminalHero";
import { modules } from "@/lib/modules";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <>
      <TerminalHero />

      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 border-t border-border">
        <p className="font-mono text-xs text-amber mb-4"># why_this_course</p>
        <h2 className="text-3xl sm:text-4xl font-display mb-6 max-w-2xl">
          Fewer slides. More running code.
        </h2>
        <div className="grid md:grid-cols-2 gap-8 text-warm-off/85">
          <p>
            This is the companion site to the YouTube series. Every module contains a live editor
            that runs real Python in your browser via Pyodide — no installation, no configuration,
            no waiting on a remote server. Type, hit Run, read the output.
          </p>
          <p>
            Twelve modules take you from installation to a working data-persisting mini-project.
            Each module has theory notes, a live-coding demo, a hands-on challenge with automatic
            pass/fail, a quiz, and a discussion thread. Progress lives in your browser.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
        <p className="font-mono text-xs text-amber mb-4"># certificate.py</p>
        <h2 className="text-3xl sm:text-4xl font-display mb-8">
          Finish the twelve. Print the certificate.
        </h2>
        <div className="rounded-lg border border-border bg-[oklch(0.15_0.02_240)] p-6 sm:p-10 font-mono text-sm">
          <p className="text-muted-foreground">$ ./certificate --for "your name"</p>
          <pre className="text-teal mt-3 whitespace-pre-wrap leading-6">
            {`+-----------------------------------------------+
|             CERTIFICATE OF COMPLETION         |
|                                               |
|   awarded to: <your name>                     |
|   course:     Python Community Development    |
|   modules:    12 / 12                         |
|   signed:     >>> pycourse                    |
+-----------------------------------------------+`}
          </pre>
          <p className="mt-4 text-muted-foreground">
            {"# unlocked when all modules are marked complete and the certificate quiz passes."}
          </p>
          <Link
            to="/certificate"
            className="inline-block mt-4 px-4 py-2 rounded bg-amber text-primary-foreground text-xs font-semibold"
          >
            preview_certificate()
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <p className="font-mono text-xs text-amber mb-4"># all_modules</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {modules.map((m) => (
            <Link
              key={m.id}
              to="/modules/$slug"
              params={{ slug: m.slug }}
              className="block p-4 border border-border rounded hover:border-amber hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber/5 transition-all duration-200 group"
            >
              <div className="font-mono text-xs text-amber">
                module_{m.id.toString().padStart(2, "0")}
              </div>
              <div className="mt-1 font-display text-lg group-hover:text-amber">{m.title}</div>
              <div className="mt-2 font-mono text-xs text-muted-foreground">
                {m.tags.join(" · ")}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
