import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import { runPython, preloadPyodide, usePyodideStatus } from "@/lib/pyodide-runner";
import { pycourseTheme, runKeybinding, PyodideStatusBanner } from "@/components/CodeEditor";

export const Route = createFileRoute("/playground")({
  head: () => ({
    meta: [
      { title: "Playground — pycourse" },
      { name: "description", content: "Interactive Python playground running in your browser." },
    ],
  }),
  component: PlaygroundPage,
});

const STARTER_CODE = `# Welcome to the Python Playground!
# This is a scratchpad for you to experiment with Python.
# Your code is automatically saved to your browser.

def greet(name):
    print(f"Hello, {name}!")

greet("World")
`;

const STORAGE_KEY = "pyc-playground-code-v1";

function PlaygroundPage() {
  const [code, setCode] = useState(() => {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem(STORAGE_KEY) ?? STARTER_CODE;
    }
    return STARTER_CODE;
  });

  const [stdout, setStdout] = useState("");
  const [stderr, setStderr] = useState("");
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [timedOut, setTimedOut] = useState(false);
  
  const pyStatus = usePyodideStatus();
  const cmRef = useRef<ReactCodeMirrorRef>(null);

  useEffect(() => { preloadPyodide(); }, []);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleChange = useCallback((value: string) => {
    setCode(value);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, value); } catch {}
    }, 600);
  }, []);

  const reset = useCallback(() => {
    setCode(STARTER_CODE);
    try { localStorage.setItem(STORAGE_KEY, STARTER_CODE); } catch {}
    setStdout("");
    setStderr("");
    setTimedOut(false);
    setStatus("idle");
  }, []);

  const clearOutput = useCallback(() => {
    setStdout("");
    setStderr("");
    setTimedOut(false);
    setStatus("idle");
  }, []);

  const downloadCode = useCallback(() => {
    // Using application/octet-stream forces the browser to download it 
    // exactly as a .py file and stops Windows from appending .txt
    const blob = new Blob([code], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "playground.py";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [code]);

  const run = useCallback(async () => {
    if (status === "running") return;
    setStatus("running");
    setStdout("");
    setStderr("");
    setTimedOut(false);

    const result = await runPython(code);

    setStdout(result.stdout.trimEnd());
    setStderr(result.stderr.trimEnd());
    setTimedOut(!!result.timedOut);
    setStatus(result.ok ? "done" : "error");
  }, [code, status]);

  const runRef = useRef(run);
  runRef.current = run;
  const keybindExt = useMemo(() => runKeybinding(() => runRef.current()), []);
  const allExtensions = useMemo(() => [python(), pycourseTheme, keybindExt], [keybindExt]);

  const isRunning = status === "running";
  const pyLoading = pyStatus === "starting";

  return (
    <div className="flex-1 flex flex-col sm:h-[calc(100vh-57px)]">
      {/* Header bar */}
      <div className="flex-none px-4 py-3 border-b border-border bg-background flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold">Python Playground</h1>
          <p className="text-sm text-muted-foreground">Open scratchpad. Code is saved to your browser.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadCode}
            title="Download code as playground.py"
            className="font-mono text-xs px-3 py-1.5 rounded border border-border text-muted-foreground hover:text-teal hover:border-teal transition-colors"
          >
            ↓ download
          </button>
          <button
            onClick={reset}
            className="font-mono text-xs px-3 py-1.5 rounded border border-border text-muted-foreground hover:text-amber hover:border-amber transition-colors"
          >
            ↺ reset code
          </button>
          <button
            onClick={run}
            disabled={isRunning || pyLoading}
            title="Run code (Ctrl+Enter)"
            className={`flex items-center gap-1.5 font-mono text-xs px-4 py-1.5 rounded font-semibold transition-all ${
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
        </div>
      </div>

      <PyodideStatusBanner />

      {/* Main split view */}
      <div className="flex-1 flex flex-col sm:flex-row overflow-hidden bg-[oklch(0.14_0.02_240)]">
        {/* Left: Editor (60%) */}
        <div className="w-full sm:w-[60%] flex flex-col border-b sm:border-b-0 sm:border-r border-white/10 relative overflow-hidden">
          <div className="flex-none bg-[oklch(0.12_0.02_240)] px-4 py-1.5 font-mono text-[10px] text-muted-foreground border-b border-white/5 flex justify-between items-center">
            <span>In [ ]: main.py</span>
            <span className="hidden sm:inline opacity-50">Ctrl+Enter to run</span>
          </div>
          <div className="flex-1 overflow-y-auto bg-[oklch(0.16_0.02_240)]">
            <CodeMirror
              ref={cmRef}
              value={code}
              onChange={handleChange}
              extensions={allExtensions}
              theme={oneDark}
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
              style={{ fontSize: "14px", height: "100%" }}
            />
          </div>
        </div>

        {/* Right: Output (40%) */}
        <div className="w-full sm:w-[40%] flex flex-col bg-[oklch(0.15_0.02_240)] relative overflow-hidden">
          <div className="flex-none bg-[oklch(0.13_0.02_240)] px-4 py-1.5 font-mono text-[10px] text-muted-foreground border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-teal">Out[ ]:</span>
              {isRunning && <span className="text-amber animate-pulse">executing…</span>}
              {timedOut && <span className="text-coral">timed out after 10 s</span>}
            </div>
            <button
              onClick={clearOutput}
              disabled={isRunning || (!stdout && !stderr)}
              className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              title="Clear output"
            >
              clear
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 font-mono text-[13px] leading-relaxed">
            {isRunning && !stdout && !stderr && (
              <div className="text-muted-foreground opacity-60">[ running… ]</div>
            )}
            {!isRunning && !stdout && !stderr && (
              <div className="text-muted-foreground opacity-40 italic">
                Output will appear here...
              </div>
            )}
            {stdout && (
              <pre className="text-teal whitespace-pre-wrap break-words">{stdout}</pre>
            )}
            {stderr && (
              <pre className={`whitespace-pre-wrap break-words mt-1 ${timedOut ? "text-coral" : "text-coral"}`}>
                {stderr}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
