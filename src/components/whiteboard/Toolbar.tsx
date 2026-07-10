/* ── Floating toolbar ─────────────────────────────────────────────── */

import { useState } from "react";
import type { Tool, BackgroundKind } from "./types";
import { TOOL_LABELS, PALETTE } from "./types";

interface ToolbarProps {
  tool: Tool;
  setTool: (t: Tool) => void;
  penColor: string;
  setPenColor: (c: string) => void;
  penThickness: number;
  setPenThickness: (t: number) => void;
  shapeStrokeColor: string;
  setShapeStrokeColor: (c: string) => void;
  shapeStrokeWidth: number;
  setShapeStrokeWidth: (w: number) => void;
  shapeFillColor: string | null;
  setShapeFillColor: (c: string | null) => void;
  background: BackgroundKind;
  setBackground: (b: BackgroundKind) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onExportPNG: (scale: 2 | 3, bg: "transparent" | "parchment") => void;
  onExportSVG: () => void;
  onClearAll: () => void;
  onTogglePresent: () => void;
  onOpenTemplates: () => void;
  onOpenSnippets: () => void;
  onOpenBoards: () => void;
  presentMode: boolean;
}

const TOOL_ICONS: Record<Tool, string> = {
  select: "⇲",
  pen: "✎",
  line: "╱",
  arrow: "→",
  rect: "▭",
  ellipse: "◯",
  diamond: "◇",
  text: "T",
  eraser: "⌫",
  code: "{ }",
  sticky: "🗒",
  laser: "◉",
};

const TOOL_ORDER: Tool[] = [
  "select",
  "pen",
  "line",
  "arrow",
  "rect",
  "ellipse",
  "diamond",
  "text",
  "eraser",
  "code",
  "sticky",
  "laser",
];

export function Toolbar(props: ToolbarProps) {
  const [expanded, setExpanded] = useState<"pen" | "shape" | "export" | null>(null);

  const isShape = (t: Tool) =>
    ["line", "arrow", "rect", "ellipse", "diamond"].includes(t);

  const handleToolClick = (t: Tool) => {
    props.setTool(t);
    if (t === "pen") {
      setExpanded((e) => (e === "pen" ? null : "pen"));
    } else if (isShape(t)) {
      setExpanded((e) => (e === "shape" ? null : "shape"));
    } else {
      setExpanded(null);
    }
  };

  if (props.presentMode) return null;

  return (
    <div className="wb-toolbar-wrap">
      {/* Main tool strip */}
      <div className="wb-toolbar">
        {TOOL_ORDER.map((t) => (
          <button
            key={t}
            className={`wb-tool-btn ${props.tool === t ? "wb-tool-active" : ""}`}
            onClick={() => handleToolClick(t)}
            title={`${TOOL_LABELS[t].label} (${TOOL_LABELS[t].shortcut})`}
          >
            <span className="wb-tool-icon">{TOOL_ICONS[t]}</span>
            <span className="wb-tool-shortcut">{TOOL_LABELS[t].shortcut}</span>
          </button>
        ))}

        <div className="wb-toolbar-divider" />

        {/* Undo / Redo */}
        <button
          className="wb-tool-btn"
          onClick={props.onUndo}
          disabled={!props.canUndo}
          title="Undo (Ctrl+Z)"
        >
          ↶
        </button>
        <button
          className="wb-tool-btn"
          onClick={props.onRedo}
          disabled={!props.canRedo}
          title="Redo (Ctrl+Shift+Z)"
        >
          ↷
        </button>

        {/* Clear all */}
        <button
          className="wb-tool-btn wb-tool-clear"
          onClick={props.onClearAll}
          title="Clear all"
        >
          ⊘
        </button>

        <div className="wb-toolbar-divider" />

        {/* Boards */}
        <button className="wb-tool-btn" onClick={props.onOpenBoards} title="Boards">
          ☰
        </button>

        {/* Templates */}
        <button className="wb-tool-btn" onClick={props.onOpenTemplates} title="Templates">
          ⊞
        </button>

        {/* Code snippets */}
        <button className="wb-tool-btn" onClick={props.onOpenSnippets} title="Insert code snippet">
          ⟨⟩
        </button>

        <div className="wb-toolbar-divider" />

        {/* Background toggle */}
        <button
          className="wb-tool-btn"
          onClick={() => {
            const cycle: BackgroundKind[] = ["none", "dots", "grid"];
            const idx = cycle.indexOf(props.background);
            props.setBackground(cycle[(idx + 1) % cycle.length]);
          }}
          title={`Background: ${props.background}`}
        >
          {props.background === "dots" ? "⁘" : props.background === "grid" ? "▦" : "▢"}
        </button>

        {/* Export */}
        <button
          className="wb-tool-btn"
          onClick={() => setExpanded((e) => (e === "export" ? null : "export"))}
          title="Export"
        >
          ⤓
        </button>

        {/* Present */}
        <button className="wb-tool-btn" onClick={props.onTogglePresent} title="Present mode">
          ▶
        </button>
      </div>

      {/* ── Sub-panels ──────────────────────────────── */}

      {expanded === "pen" && (
        <div className="wb-subpanel">
          <label className="wb-subpanel-label">Thickness</label>
          <input
            type="range"
            min={3}
            max={20}
            value={props.penThickness}
            onChange={(e) => props.setPenThickness(Number(e.target.value))}
            className="wb-slider"
          />
          <span className="wb-slider-val">{props.penThickness}px</span>

          <label className="wb-subpanel-label">Color</label>
          <div className="wb-palette">
            {PALETTE.map((c) => (
              <button
                key={c.value}
                className={`wb-color-btn ${props.penColor === c.value ? "wb-color-active" : ""}`}
                style={{ background: c.value }}
                onClick={() => props.setPenColor(c.value)}
                title={c.name}
              />
            ))}
            <label className="wb-color-btn wb-color-custom" title="Custom color">
              +
              <input
                type="color"
                value="#e8a946"
                onChange={(e) => props.setPenColor(e.target.value)}
                style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
              />
            </label>
          </div>
        </div>
      )}

      {expanded === "shape" && (
        <div className="wb-subpanel">
          <label className="wb-subpanel-label">Stroke Width</label>
          <input
            type="range"
            min={1}
            max={12}
            value={props.shapeStrokeWidth}
            onChange={(e) => props.setShapeStrokeWidth(Number(e.target.value))}
            className="wb-slider"
          />
          <span className="wb-slider-val">{props.shapeStrokeWidth}px</span>

          <label className="wb-subpanel-label">Stroke Color</label>
          <div className="wb-palette">
            {PALETTE.map((c) => (
              <button
                key={c.value}
                className={`wb-color-btn ${props.shapeStrokeColor === c.value ? "wb-color-active" : ""}`}
                style={{ background: c.value }}
                onClick={() => props.setShapeStrokeColor(c.value)}
                title={c.name}
              />
            ))}
          </div>

          <label className="wb-subpanel-label">
            <input
              type="checkbox"
              checked={props.shapeFillColor !== null}
              onChange={(e) =>
                props.setShapeFillColor(
                  e.target.checked ? "rgba(200,170,80,0.15)" : null,
                )
              }
            />
            {" "}Fill
          </label>
          {props.shapeFillColor !== null && (
            <div className="wb-palette">
              {PALETTE.map((c) => (
                <button
                  key={c.value}
                  className={`wb-color-btn ${props.shapeFillColor === c.value ? "wb-color-active" : ""}`}
                  style={{ background: c.value, opacity: 0.5 }}
                  onClick={() => props.setShapeFillColor(c.value)}
                  title={c.name}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {expanded === "export" && (
        <div className="wb-subpanel">
          <label className="wb-subpanel-label">Export</label>
          <button className="wb-export-btn" onClick={() => props.onExportPNG(2, "transparent")}>
            PNG 2× (transparent)
          </button>
          <button className="wb-export-btn" onClick={() => props.onExportPNG(3, "parchment")}>
            PNG 3× (parchment)
          </button>
          <button className="wb-export-btn" onClick={props.onExportSVG}>
            SVG (scalable)
          </button>
        </div>
      )}
    </div>
  );
}
