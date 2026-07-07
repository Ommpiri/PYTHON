import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { EditorView } from "@codemirror/view";
import { oneDark } from "@codemirror/theme-one-dark";
import { runPython, preloadPyodide, usePyodideStatus } from "@/lib/pyodide-runner";
import { recordChallenge } from "@/lib/progress";

// ------------------------------------------------------------------
// Custom pycourse editor theme (amber + teal + coral on dark ink bg)
// ------------------------------------------------------------------
export const pycourseTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "oklch(0.16 0.02 240)",
      color: "oklch(0.93 0.015 85)",
      fontSize: "13px",
      fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
    },
    ".cm-content": { padding: "12px 0", caretColor: "oklch(0.76 0.14 75)" },
    ".cm-line": { padding: "0 16px" },
    ".cm-gutters": {
      backgroundColor: "oklch(0.14 0.02 240)",
      color: "oklch(0.52 0.02 240)",
      border: "none",
      paddingRight: "8px",
    },
    ".cm-activeLineGutter": { backgroundColor: "oklch(0.18 0.02 240)" },
    ".cm-activeLine": { backgroundColor: "oklch(0.19 0.02 240)" },
    ".cm-selectionBackground, ::selection": {
      backgroundColor: "oklch(0.76 0.14 75 / 0.25) !important",
    },
    ".cm-cursor": { borderLeftColor: "oklch(0.76 0.14 75)" },
    ".cm-matchingBracket": { outline: "1px solid oklch(0.76 0.14 75 / 0.5)", borderRadius: "2px" },
    ".cm-foldPlaceholder": {
      backgroundColor: "oklch(0.25 0.02 240)",
      color: "oklch(0.76 0.14 75)",
      border: "none",
    },
    // Syntax tokens
    ".tok-keyword": { color: "oklch(0.76 0.14 75)" }, // amber  — def, for, if…
    ".tok-string": { color: "oklch(0.66 0.08 175)" }, // teal   — "strings"
    ".tok-comment": { color: "oklch(0.52 0.02 240)", fontStyle: "italic" },
    ".tok-number": { color: "oklch(0.66 0.15 30)" }, // coral  — 42
    ".tok-operator": { color: "oklch(0.85 0.06 75)" },
    ".tok-variableName": { color: "oklch(0.88 0.02 85)" },
    ".tok-function(Definition)": { color: "oklch(0.78 0.1 175)" },
    ".tok-className": { color: "oklch(0.78 0.1 175)" },
    ".tok-bool": { color: "oklch(0.76 0.14 75)", fontWeight: "600" },
    ".tok-null": { color: "oklch(0.76 0.14 75)" },
  },
  { dark: true },
);

const extensions = [python(), pycourseTheme];

// Ctrl/Cmd+Enter run keybinding — added via CodeMirror extension per editor instance
export function runKeybinding(onRun: () => void) {
  return EditorView.domEventHandlers({
    keydown(e) {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onRun();
        return true;
      }
      return false;
    },
  });
}

// ------------------------------------------------------------------
// localStorage helpers  (persist code per module + cell index)
// ------------------------------------------------------------------
function storageKey(slug: string, cellKey: string) {
  return `pyc-code-v1:${slug}:${cellKey}`;
}

function loadSaved(slug: string | undefined, cellKey: string, fallback: string): string {
  if (!slug || typeof localStorage === "undefined") return fallback;
  try {
    return localStorage.getItem(storageKey(slug, cellKey)) ?? fallback;
  } catch {
    return fallback;
  }
}

function saveCode(slug: string | undefined, cellKey: string, code: string) {
  if (!slug || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(storageKey(slug, cellKey), code);
  } catch {
    // storage full — ignore
  }
}

// ------------------------------------------------------------------
// Status banner shown while Pyodide initialises
// ------------------------------------------------------------------
export function PyodideStatusBanner() {
  const status = usePyodideStatus();
  if (status === "ready" || status === "running") return null;
  const msgs: Record<string, string> = {
    idle: "Python not loaded yet.",
    starting: "Starting Python runtime…  (downloading ~10 MB, first visit only)",
    error: "Python runtime failed to load. Try refreshing the page.",
  };
  const colors: Record<string, string> = {
    idle: "text-muted-foreground",
    starting: "text-amber",
    error: "text-coral",
  };
  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 font-mono text-xs border-b border-white/5 ${colors[status] ?? "text-muted-foreground"}`}
    >
      {status === "starting" && (
        <span className="inline-block w-2 h-2 rounded-full bg-amber animate-pulse" />
      )}
      {msgs[status] ?? ""}
    </div>
  );
}

// ------------------------------------------------------------------
// Main CodeEditor component
// ------------------------------------------------------------------
export function CodeEditor({
  starter,
  expectedIncludes,
  slug,
  cellKey = "live",
  onPass,
  trace,
  onTrace,
}: {
  starter: string;
  expectedIncludes?: string[];
  slug?: string;
  /** Unique key per cell within a module (e.g. "live", "challenge_1") */
  cellKey?: string;
  onPass?: () => void;
  trace?: boolean;
  onTrace?: (lines: number[]) => void;
}) {
  // Load saved code from localStorage (or fall back to starter)
  const initialCode = useMemo(
    () => loadSaved(slug, cellKey, starter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slug, cellKey],
  );

  const [code, setCode] = useState(initialCode);
  const [stdout, setStdout] = useState("");
  const [stderr, setStderr] = useState("");
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [pass, setPass] = useState<null | boolean>(null);
  const [timedOut, setTimedOut] = useState(false);
  const pyStatus = usePyodideStatus();

  const cmRef = useRef<ReactCodeMirrorRef>(null);

  // Preload Pyodide when the editor mounts so it's warm by the time they click Run
  useEffect(() => {
    preloadPyodide();
  }, []);

  // Persist code changes (debounced 600 ms)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleChange = useCallback(
    (value: string) => {
      setCode(value);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveCode(slug, cellKey, value), 600);
    },
    [slug, cellKey],
  );

  // Reset code to starter
  const reset = useCallback(() => {
    setCode(starter);
    saveCode(slug, cellKey, starter);
    setStdout("");
    setStderr("");
    setPass(null);
    setTimedOut(false);
    setStatus("idle");
  }, [starter, slug, cellKey]);

  // Download current code
  const download = useCallback(() => {
    // Using application/octet-stream forces the browser to download it
    // exactly as a .py file and stops Windows from appending .txt
    const blob = new Blob([code], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    // Construct a friendly filename, e.g. "basics_challenge_1.py" or "script.py"
    const prefix = slug ? slug.replace(/[^a-z0-9]/gi, "_") : "script";
    const suffix = cellKey ? cellKey.replace(/[^a-z0-9]/gi, "_") : "code";
    link.download = `${prefix}_${suffix}.py`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [code, slug, cellKey]);

  // Run code
  const run = useCallback(async () => {
    if (status === "running") return;
    setStatus("running");
    setStdout("");
    setStderr("");
    setPass(null);
    setTimedOut(false);

    const res = await runPython(code, { trace });
    setStatus(res.ok ? "done" : "error");
    setStdout(res.stdout);
    setStderr(res.stderr);
    setTimedOut(res.timedOut ?? false);

    if (trace && res.traceLines && onTrace) {
      onTrace(res.traceLines);
    }

    if (expectedIncludes && res.ok) {
      const passed = expectedIncludes.every((s) => res.stdout.includes(s));
      setPass(passed);
      if (passed && slug) {
        recordChallenge(slug);
        onPass?.();
      }
    }
  }, [code, expectedIncludes, slug, onPass, status]);

  // Ctrl+Enter keybinding extension (re-created when run ref changes)
  const runRef = useRef(run);
  runRef.current = run;
  const keybindExt = useMemo(() => runKeybinding(() => runRef.current()), []);
  const allExtensions = useMemo(() => [...extensions, keybindExt], [keybindExt]);

  const isRunning = status === "running";
  const pyLoading = pyStatus === "starting";
  const hasOutput = stdout || stderr || isRunning;

  return (
    <div className="rounded-md overflow-hidden border border-white/10 bg-[oklch(0.16_0.02_240)] shadow-xl">
      {/* Pyodide status banner (only shown while loading) */}
      <PyodideStatusBanner />

      {/* CodeMirror editor */}
      <div className="relative">
        <CodeMirror
          ref={cmRef}
          value={code}
          onChange={handleChange}
          extensions={allExtensions}
          theme={oneDark} // base layer; pycourseTheme overrides on top
          basicSetup={{
            lineNumbers: true,
            foldGutter: false,
            dropCursor: false,
            allowMultipleSelections: false,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: false,
            crosshairCursor: false,
            highlightActiveLine: true,
            highlightActiveLineGutter: true,
            highlightSelectionMatches: false,
            tabSize: 4,
          }}
          style={{ fontSize: "13px" }}
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-white/10 bg-[oklch(0.14_0.02_240)]">
        <div className="flex items-center gap-2">
          {/* Run button */}
          <button
            onClick={run}
            disabled={isRunning || pyLoading}
            title="Run code (Ctrl+Enter)"
            className={`flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 rounded font-semibold transition-all ${
              isRunning
                ? "bg-amber/60 text-primary-foreground cursor-wait"
                : pyLoading
                  ? "bg-secondary text-muted-foreground cursor-wait"
                  : "bg-amber text-primary-foreground hover:opacity-90"
            }`}
          >
            {isRunning ? (
              <>
                <span className="inline-block w-2 h-2 rounded-full bg-white/70 animate-pulse" />
                running…
              </>
            ) : pyLoading ? (
              <>
                <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground animate-pulse" />
                starting python…
              </>
            ) : (
              "▶ Run"
            )}
          </button>

          {/* Download button */}
          <button
            onClick={download}
            title="Download code as .py file"
            className="font-mono text-xs px-3 py-1.5 rounded border border-white/15 text-muted-foreground hover:border-teal hover:text-teal transition-colors"
          >
            ↓ save
          </button>

          {/* Reset button */}
          <button
            onClick={reset}
            title="Reset to starter code"
            className="font-mono text-xs px-3 py-1.5 rounded border border-white/15 text-muted-foreground hover:border-amber hover:text-amber transition-colors"
          >
            ↺ reset
          </button>

          {/* Ctrl+Enter hint */}
          <span className="hidden sm:inline font-mono text-[10px] text-muted-foreground/50 ml-1">
            Ctrl+Enter to run
          </span>
        </div>

        {/* Challenge pass/fail badge */}
        {pass !== null && (
          <span
            className={`font-mono text-xs flex items-center gap-1 ${
              pass ? "text-teal" : "text-coral"
            }`}
          >
            {pass ? "✓ challenge passed" : "✗ output didn't match"}
          </span>
        )}
      </div>

      {/* Output console */}
      {hasOutput && (
        <div className="border-t border-white/10">
          {/* Console header */}
          <div className="flex items-center gap-2 px-4 py-1.5 bg-[oklch(0.13_0.02_240)] font-mono text-[10px] text-muted-foreground">
            <span className="text-teal">Out[ ]:</span>
            {isRunning && <span className="text-amber animate-pulse">executing…</span>}
            {timedOut && <span className="text-coral">timed out after 10 s</span>}
            {!isRunning && !timedOut && stdout && <span className="text-teal/60">stdout</span>}
            {!isRunning && stderr && <span className="text-coral/80 ml-1">stderr</span>}
          </div>

          <div className="p-4 font-mono text-xs leading-6 bg-[oklch(0.15_0.02_240)] min-h-[3rem] max-h-72 overflow-y-auto">
            {isRunning && !stdout && !stderr && (
              <div className="text-muted-foreground">[ running… ]</div>
            )}
            {stdout && <pre className="text-teal whitespace-pre-wrap break-words">{stdout}</pre>}
            {stderr && (
              <div className="mt-2 flex flex-col items-start gap-2">
                <pre
                  className={`whitespace-pre-wrap break-words ${timedOut ? "text-coral" : "text-coral"}`}
                >
                  {stderr}
                </pre>
                {!isRunning && (
                  <button
                    onClick={() => {
                      const event = new CustomEvent("pydude-explain", {
                        detail: { code, error: stderr, slug },
                      });
                      window.dispatchEvent(event);
                    }}
                    className="mt-1 font-mono text-[10px] uppercase tracking-wider px-2 py-1 bg-coral/10 text-coral border border-coral/30 rounded hover:bg-coral hover:text-white transition-colors"
                  >
                    💡 Explain this error
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
