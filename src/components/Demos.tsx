import { useEffect, useState } from "react";
import { runPython } from "@/lib/pyodide-runner";

export function InstallCheck() {
  const [state, setState] = useState<"idle" | "checking" | "ok" | "err">("idle");
  const [version, setVersion] = useState<string>("");

  const check = async () => {
    setState("checking");
    const r = await runPython("import sys; print(sys.version.split(' ')[0])");
    if (r.ok && r.stdout.trim()) {
      setVersion(r.stdout.trim());
      setState("ok");
    } else {
      setState("err");
    }
  };

  useEffect(() => {
    // don't auto-load pyodide on mount — wait for user click
  }, []);

  const steps = [
    { label: "runtime available", done: state === "ok" },
    { label: "sys module importable", done: state === "ok" },
    { label: `version >= 3.10  ${version ? "→ " + version : ""}`.trim(), done: state === "ok" },
  ];

  return (
    <div className="font-mono text-sm">
      <button
        onClick={check}
        disabled={state === "checking"}
        className="px-3 py-1.5 rounded bg-amber text-primary-foreground text-xs font-semibold mb-3 disabled:opacity-60"
      >
        {state === "checking" ? "verifying…" : "verify_install()"}
      </button>
      {state === "checking" && (
        <p className="text-xs text-muted-foreground mb-3">
          Loading Python runtime (~20 MB on first run) — this may take a moment…
        </p>
      )}
      <ul className="space-y-1">
        {steps.map((s, i) => (
          <li key={i} className={s.done ? "text-teal" : "text-muted-foreground"}>
            [{s.done ? "✓" : " "}] {s.label}
          </li>
        ))}
      </ul>
      {state === "err" && <p className="mt-2 text-coral">Could not initialize the runtime.</p>}
    </div>
  );
}

// -----------------------------------------------------------------------------

export function LoopVisualizer() {
  const [i, setI] = useState(0);
  const items = ["Fizz? no", "Buzz? no", "print(1)", "print(2)", "Fizz", "print(4)", "Buzz"];
  return (
    <div className="font-mono text-sm">
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setI((v) => Math.max(0, v - 1))}
          className="px-2 py-1 rounded border border-border text-foreground text-xs hover:border-amber transition-colors"
        >
          ← step
        </button>
        <button
          onClick={() => setI((v) => Math.min(items.length - 1, v + 1))}
          className="px-2 py-1 rounded bg-amber text-primary-foreground text-xs font-semibold"
        >
          step →
        </button>
        <button
          onClick={() => setI(0)}
          className="px-2 py-1 rounded border border-border text-foreground text-xs hover:border-amber transition-colors"
        >
          reset
        </button>
      </div>
      <pre className="bg-secondary rounded p-3 leading-6 text-foreground">
        {`for n in range(1, 8):
    if n % 15 == 0: print("FizzBuzz")
    elif n % 3 == 0: print("Fizz")
    elif n % 5 == 0: print("Buzz")
    else: print(n)`}
      </pre>
      <div className="mt-3 grid grid-cols-7 gap-1">
        {items.map((_, idx) => (
          <div
            key={idx}
            className={`text-xs text-center py-2 rounded ${
              idx === i
                ? "bg-amber text-primary-foreground font-bold"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            n={idx + 1}
          </div>
        ))}
      </div>
      <p className="mt-3 text-muted-foreground">
        current iteration → <span className="text-teal">{items[i]}</span>
      </p>
    </div>
  );
}

// -----------------------------------------------------------------------------

export function DsVisualizer() {
  const [list, setList] = useState<number[]>([1, 2, 3]);
  const [dict, setDict] = useState<Record<string, number>>({ ada: 1, linus: 2 });
  const [log, setLog] = useState<string[]>([]);

  const push = (s: string) => setLog((l) => [s, ...l].slice(0, 6));

  return (
    <div className="font-mono text-sm grid md:grid-cols-2 gap-4">
      <div>
        <p className="text-muted-foreground mb-2"># list</p>
        <div className="flex flex-wrap gap-1 mb-2 min-h-[2rem]">
          {list.map((x, i) => (
            <span
              key={i}
              className="px-2 py-1 rounded bg-amber/20 text-foreground border border-amber/40"
            >
              [{i}]={x}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          <button
            className="text-xs px-2 py-1 rounded bg-teal text-warm-off"
            onClick={() => {
              const n = (list.at(-1) ?? 0) + 1;
              setList([...list, n]);
              push(`list.append(${n})`);
            }}
          >
            append
          </button>
          <button
            className="text-xs px-2 py-1 rounded border border-border text-foreground hover:border-amber transition-colors"
            onClick={() => {
              if (!list.length) return;
              const v = list[list.length - 1];
              setList(list.slice(0, -1));
              push(`list.pop() -> ${v}`);
            }}
          >
            pop
          </button>
          <button
            className="text-xs px-2 py-1 rounded border border-border text-foreground hover:border-amber transition-colors"
            onClick={() => {
              setList([99, ...list]);
              push("list.insert(0, 99)");
            }}
          >
            insert(0, 99)
          </button>
        </div>
      </div>
      <div>
        <p className="text-muted-foreground mb-2"># dict</p>
        <div className="space-y-1 mb-2 min-h-[2rem]">
          {Object.entries(dict).map(([k, v]) => (
            <div key={k} className="px-2 py-1 rounded bg-teal/15 border border-teal/30">
              <span className="text-teal">"{k}"</span>: <span className="text-foreground">{v}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          <button
            className="text-xs px-2 py-1 rounded bg-teal text-warm-off"
            onClick={() => {
              const k = "user" + (Object.keys(dict).length + 1);
              setDict({ ...dict, [k]: Object.keys(dict).length + 1 });
              push(`dict["${k}"] = ...`);
            }}
          >
            add key
          </button>
          <button
            className="text-xs px-2 py-1 rounded border border-border text-foreground hover:border-amber transition-colors"
            onClick={() => {
              const key = Object.keys(dict)[0];
              if (!key) return;
              const cp = { ...dict };
              delete cp[key];
              setDict(cp);
              push(`del dict["${key}"]`);
            }}
          >
            del first
          </button>
          <button
            className="text-xs px-2 py-1 rounded border border-border text-foreground hover:border-amber transition-colors"
            onClick={() => {
              const key = Object.keys(dict)[0] ?? "missing";
              push(`dict.get("${key}") -> ${dict[key] ?? "None"}`);
            }}
          >
            get
          </button>
        </div>
      </div>
      <div className="md:col-span-2">
        <p className="text-muted-foreground mb-1"># operation log</p>
        <div className="bg-secondary rounded p-2 text-xs leading-6 min-h-[5rem]">
          {log.length === 0 ? (
            <span className="text-muted-foreground">no operations yet</span>
          ) : (
            log.map((l, i) => (
              <div key={i}>
                {">>> "}
                {l}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
