// Pyodide runner — singleton Web Worker manager.
// The worker loads Pyodide once; subsequent runs reuse the same warm instance.
// Infinite-loop / hung code is killed after TIMEOUT_MS and the worker is
// recreated so the next run can still work (showing "Starting Python…" again).

export type PyodideStatus = "idle" | "starting" | "ready" | "running" | "error";

export type RunResult = {
  stdout: string;
  stderr: string;
  ok: boolean;
  timedOut?: boolean;
};

const TIMEOUT_MS = 10_000;

// ---------- worker singleton ----------

let worker: Worker | null = null;
let workerStatus: PyodideStatus = "idle";
let readyCallbacks: Array<() => void> = [];
let nextId = 0;

// Map of pending run promises keyed by id
const pending = new Map<
  number,
  { resolve: (r: RunResult) => void; timer: ReturnType<typeof setTimeout> }
>();

// Listeners for status changes (consumed by the usePyodideStatus hook)
const statusListeners = new Set<(s: PyodideStatus) => void>();

function emitStatus(s: PyodideStatus) {
  workerStatus = s;
  statusListeners.forEach(fn => fn(s));
}

function createWorker(): Worker {
  emitStatus("starting");

  const w = new Worker(
    new URL("../workers/pyodide.worker.ts", import.meta.url),
    { type: "classic" } // importScripts-based worker
  );

  w.onmessage = (e: MessageEvent) => {
    const msg = e.data as
      | { type: "ready" }
      | { type: "error"; message: string }
      | { type: "result"; id: number; ok: boolean; stdout: string; stderr: string };

    if (msg.type === "ready") {
      emitStatus("ready");
      readyCallbacks.forEach(fn => fn());
      readyCallbacks = [];
      return;
    }

    if (msg.type === "error") {
      emitStatus("error");
      // Reject all pending if worker failed to init
      pending.forEach(({ resolve, timer }) => {
        clearTimeout(timer);
        resolve({ ok: false, stdout: "", stderr: msg.message });
      });
      pending.clear();
      return;
    }

    if (msg.type === "result") {
      const entry = pending.get(msg.id);
      if (!entry) return;
      clearTimeout(entry.timer);
      pending.delete(msg.id);
      emitStatus("ready");
      entry.resolve({ ok: msg.ok, stdout: msg.stdout, stderr: msg.stderr });
    }
  };

  w.onerror = (e) => {
    emitStatus("error");
    pending.forEach(({ resolve, timer }) => {
      clearTimeout(timer);
      resolve({ ok: false, stdout: "", stderr: String(e.message) });
    });
    pending.clear();
  };

  return w;
}

function getWorker(): Worker {
  if (!worker) {
    worker = createWorker();
  }
  return worker;
}

/** Wait until Pyodide inside the worker is ready. */
function waitForReady(): Promise<void> {
  if (workerStatus === "ready") return Promise.resolve();
  return new Promise(resolve => {
    readyCallbacks.push(resolve);
  });
}

/** Ensure the worker exists (and is loading). Called on module page mount so
 *  Pyodide warms up before the student clicks Run. */
export function preloadPyodide() {
  if (typeof window === "undefined") return;
  getWorker(); // creates + starts loading if not already
}

/** Run Python code. Returns stdout, stderr, and a pass/fail flag.
 *  Kills the worker and returns a friendly message if it takes > TIMEOUT_MS. */
export async function runPython(code: string): Promise<RunResult> {
  if (typeof window === "undefined") {
    return { stdout: "", stderr: "Python is client-only.", ok: false };
  }

  const w = getWorker();
  await waitForReady();

  emitStatus("running");

  const id = nextId++;

  return new Promise<RunResult>(resolve => {
    const timer = setTimeout(() => {
      // Hard-kill the worker — terminates any hanging code
      w.terminate();
      worker = null;
      pending.delete(id);
      emitStatus("idle"); // next call to getWorker() will recreate
      resolve({
        ok: false,
        stdout: "",
        stderr:
          "TimeoutError: Your code took too long to run (> 10 s).\n" +
          "Check for infinite loops or very slow algorithms.",
        timedOut: true,
      });
    }, TIMEOUT_MS);

    pending.set(id, { resolve, timer });
    w.postMessage({ id, code });
  });
}

// ---------- React hook for status ----------

import { useEffect, useState } from "react";

export function usePyodideStatus(): PyodideStatus {
  const [status, setStatus] = useState<PyodideStatus>(workerStatus);
  useEffect(() => {
    setStatus(workerStatus);
    statusListeners.add(setStatus);
    return () => { statusListeners.delete(setStatus); };
  }, []);
  return status;
}
