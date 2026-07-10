/* ── Undo / Redo Manager ──────────────────────────────────────────── */

import type { WbElement } from "./types";

const MAX_HISTORY = 50;

export class HistoryManager {
  private undoStack: WbElement[][] = [];
  private redoStack: WbElement[][] = [];

  /** Call before each mutation with the *current* element array (before the change). */
  push(snapshot: WbElement[]): void {
    this.undoStack.push(structuredClone(snapshot));
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift();
    }
    // Any new action kills the redo branch
    this.redoStack.length = 0;
  }

  undo(current: WbElement[]): WbElement[] | null {
    const prev = this.undoStack.pop();
    if (!prev) return null;
    this.redoStack.push(structuredClone(current));
    return prev;
  }

  redo(current: WbElement[]): WbElement[] | null {
    const next = this.redoStack.pop();
    if (!next) return null;
    this.undoStack.push(structuredClone(current));
    return next;
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
  }
}
