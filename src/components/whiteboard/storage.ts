/* ── Board storage (localStorage) ─────────────────────────────────── */

import type { Board } from "./types";

const STORAGE_KEY = "pyc-wb-boards";

function readAll(): Board[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Board[];
  } catch {
    return [];
  }
}

function writeAll(boards: Board[]): void {
  const json = JSON.stringify(boards);
  // Warn if nearing 5 MB limit (~90% capacity)
  if (json.length > 4_500_000) {
    console.warn(
      "[Whiteboard] localStorage usage is near capacity. Consider deleting old boards.",
    );
  }
  try {
    localStorage.setItem(STORAGE_KEY, json);
  } catch (e) {
    console.error("[Whiteboard] Failed to save — storage full?", e);
  }
}

export function listBoards(): Board[] {
  return readAll().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function loadBoard(id: string): Board | null {
  return readAll().find((b) => b.id === id) ?? null;
}

export function saveBoard(board: Board): void {
  const boards = readAll();
  const idx = boards.findIndex((b) => b.id === board.id);
  const updated = { ...board, updatedAt: Date.now() };
  if (idx >= 0) {
    boards[idx] = updated;
  } else {
    boards.push(updated);
  }
  writeAll(boards);
}

export function deleteBoard(id: string): void {
  writeAll(readAll().filter((b) => b.id !== id));
}

export function renameBoard(id: string, name: string): void {
  const boards = readAll();
  const board = boards.find((b) => b.id === id);
  if (board) {
    board.name = name;
    board.updatedAt = Date.now();
    writeAll(boards);
  }
}
