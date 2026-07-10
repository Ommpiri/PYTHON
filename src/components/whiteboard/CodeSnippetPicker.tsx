/* ── Code snippet picker ──────────────────────────────────────────── */

import { useState, useMemo } from "react";
import { modules } from "@/lib/modules";

interface CodeSnippetPickerProps {
  onSelect: (code: string, label: string) => void;
  onClose: () => void;
}

interface SnippetEntry {
  moduleId: number;
  moduleTitle: string;
  label: string;
  code: string;
}

export function CodeSnippetPicker({ onSelect, onClose }: CodeSnippetPickerProps) {
  const [query, setQuery] = useState("");

  const allSnippets = useMemo(() => {
    const entries: SnippetEntry[] = [];
    for (const mod of modules) {
      // Live coding starter
      if (mod.liveCoding.starter.trim()) {
        entries.push({
          moduleId: mod.id,
          moduleTitle: mod.title,
          label: `Live: ${mod.liveCoding.title}`,
          code: mod.liveCoding.starter,
        });
      }
      // Challenges
      for (let i = 0; i < mod.challenges.length; i++) {
        const c = mod.challenges[i];
        if (c.starter.trim()) {
          entries.push({
            moduleId: mod.id,
            moduleTitle: mod.title,
            label: `Challenge ${i + 1}: ${c.prompt.slice(0, 50)}`,
            code: c.starter,
          });
        }
      }
    }
    return entries;
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return allSnippets;
    const q = query.toLowerCase();
    return allSnippets.filter(
      (s) =>
        s.moduleTitle.toLowerCase().includes(q) ||
        s.label.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q),
    );
  }, [query, allSnippets]);

  return (
    <div className="wb-modal-overlay" onClick={onClose}>
      <div className="wb-modal wb-modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="wb-modal-header">
          <h3 className="wb-modal-title">Insert Code Snippet</h3>
          <button className="wb-modal-close" onClick={onClose}>✕</button>
        </div>

        <input
          className="wb-snippet-search"
          placeholder="Search modules, code..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        <div className="wb-snippet-list">
          {filtered.length === 0 && (
            <div className="wb-snippet-empty">No snippets found</div>
          )}
          {filtered.map((s, i) => (
            <button
              key={`${s.moduleId}-${i}`}
              className="wb-snippet-item"
              onClick={() => {
                onSelect(s.code, s.label);
                onClose();
              }}
            >
              <div className="wb-snippet-meta">
                <span className="wb-snippet-module">
                  Module {s.moduleId.toString().padStart(2, "0")}
                </span>
                <span className="wb-snippet-label">{s.label}</span>
              </div>
              <pre className="wb-snippet-preview">{s.code.slice(0, 120)}{s.code.length > 120 ? "..." : ""}</pre>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
