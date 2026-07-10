/* ── Board sidebar ────────────────────────────────────────────────── */

import { useState } from "react";
import type { Board } from "./types";

interface BoardSidebarProps {
  boards: Board[];
  activeBoardId: string;
  onSwitch: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onClose: () => void;
}

export function BoardSidebar({
  boards,
  activeBoardId,
  onSwitch,
  onNew,
  onDelete,
  onRename,
  onClose,
}: BoardSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = (b: Board) => {
    setEditingId(b.id);
    setEditValue(b.name);
  };

  const commitEdit = () => {
    if (editingId && editValue.trim()) {
      onRename(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="wb-sidebar">
      <div className="wb-sidebar-header">
        <span className="wb-sidebar-title">Boards</span>
        <button className="wb-sidebar-close" onClick={onClose} title="Close">
          ✕
        </button>
      </div>

      <div className="wb-sidebar-list">
        {boards.map((b) => (
          <div
            key={b.id}
            className={`wb-sidebar-item ${b.id === activeBoardId ? "wb-sidebar-active" : ""}`}
          >
            {editingId === b.id ? (
              <input
                className="wb-sidebar-input"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitEdit();
                  if (e.key === "Escape") setEditingId(null);
                }}
                autoFocus
              />
            ) : (
              <button
                className="wb-sidebar-name"
                onClick={() => onSwitch(b.id)}
                onDoubleClick={() => startEdit(b)}
                title="Click to switch, double-click to rename"
              >
                {b.name}
              </button>
            )}
            <div className="wb-sidebar-actions">
              <button
                className="wb-sidebar-action-btn"
                onClick={() => startEdit(b)}
                title="Rename"
              >
                ✎
              </button>
              {boards.length > 1 && (
                <button
                  className="wb-sidebar-action-btn wb-sidebar-delete"
                  onClick={() => onDelete(b.id)}
                  title="Delete"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button className="wb-sidebar-new" onClick={onNew}>
        + New board
      </button>
    </div>
  );
}
