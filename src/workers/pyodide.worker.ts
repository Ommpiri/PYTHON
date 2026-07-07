// Pyodide Web Worker — runs Python in a separate thread so the UI never freezes.
// Loaded once per session; Pyodide is cached inside the worker.

declare const loadPyodide: (opts: { indexURL: string }) => Promise<PyodideHandle>;

interface PyodideHandle {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (opts: { batched: (s: string) => void }) => void;
  setStderr: (opts: { batched: (s: string) => void }) => void;
}

const PYODIDE_VERSION = "0.26.4";
const CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

let pyodide: PyodideHandle | null = null;

// Load Pyodide eagerly so the first run is fast
async function init() {
  try {
    importScripts(`${CDN}pyodide.js`);
    pyodide = await loadPyodide({ indexURL: CDN });
    self.postMessage({ type: "ready" });
  } catch (e) {
    self.postMessage({ type: "error", message: String(e) });
  }
}

const initPromise = init();

self.onmessage = async (e: MessageEvent) => {
  const { id, code, trace } = e.data as { id: number; code: string; trace?: boolean };

  // Wait for pyodide to be ready
  await initPromise;

  if (!pyodide) {
    self.postMessage({
      id,
      type: "result",
      ok: false,
      stdout: "",
      stderr: "Python runtime failed to load.",
    });
    return;
  }

  let stdout = "";
  let stderr = "";

  pyodide.setStdout({
    batched: (s: string) => {
      stdout += s + "\n";
    },
  });
  pyodide.setStderr({
    batched: (s: string) => {
      stderr += s + "\n";
    },
  });

  try {
    let traceLines: number[] = [];
    if (trace) {
      // Create a JS array to hold the trace
      const traceArr: number[] = [];
      (self as any).__traceArr = traceArr;

      const wrapped = `
import sys
from js import __traceArr

def __tracer(frame, event, arg):
    if event == 'line' and frame.f_code.co_filename == '<string>':
        __traceArr.append(frame.f_lineno)
    return __tracer

sys.settrace(__tracer)
try:
    exec(compile(${JSON.stringify(code)}, '<string>', 'exec'), globals())
finally:
    sys.settrace(None)
`;
      await pyodide.runPythonAsync(wrapped);
      traceLines = [...traceArr];
    } else {
      await pyodide.runPythonAsync(code);
    }
    self.postMessage({ id, type: "result", ok: !stderr, stdout, stderr, traceLines });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    self.postMessage({
      id,
      type: "result",
      ok: false,
      stdout,
      stderr: stderr + msg,
      traceLines: [],
    });
  }
};
