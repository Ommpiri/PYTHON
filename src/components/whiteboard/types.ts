/* ── Whiteboard types ───────────────────────────────────────────────── */

export type Point = { x: number; y: number };
export type PressurePoint = Point & { pressure: number };

/* ── Tools ────────────────────────────────────────────────────────── */

export type Tool =
  | "select"
  | "pen"
  | "line"
  | "arrow"
  | "rect"
  | "ellipse"
  | "diamond"
  | "text"
  | "eraser"
  | "code"
  | "sticky"
  | "laser";

export const TOOL_SHORTCUTS: Record<string, Tool> = {
  v: "select",
  p: "pen",
  l: "line",
  a: "arrow",
  r: "rect",
  o: "ellipse",
  d: "diamond",
  t: "text",
  x: "eraser",
  c: "code",
  n: "sticky",
  z: "laser",
};

export const TOOL_LABELS: Record<Tool, { label: string; shortcut: string }> = {
  select: { label: "Select", shortcut: "V" },
  pen: { label: "Pen", shortcut: "P" },
  line: { label: "Line", shortcut: "L" },
  arrow: { label: "Arrow", shortcut: "A" },
  rect: { label: "Rectangle", shortcut: "R" },
  ellipse: { label: "Ellipse", shortcut: "O" },
  diamond: { label: "Diamond", shortcut: "D" },
  text: { label: "Text", shortcut: "T" },
  eraser: { label: "Eraser", shortcut: "X" },
  code: { label: "Code Snippet", shortcut: "C" },
  sticky: { label: "Sticky Note", shortcut: "N" },
  laser: { label: "Laser Pointer", shortcut: "Z" },
};

/* ── Palette ──────────────────────────────────────────────────────── */

export const PALETTE = [
  { name: "Amber", value: "oklch(0.76 0.14 75)" },
  { name: "Teal", value: "oklch(0.66 0.08 175)" },
  { name: "Coral", value: "oklch(0.72 0.17 25)" },
  { name: "Navy", value: "oklch(0.19 0.02 240)" },
  { name: "Warm Off", value: "oklch(0.93 0.015 85)" },
  { name: "Gray", value: "oklch(0.7 0.02 240)" },
  { name: "White", value: "#ffffff" },
  { name: "Black", value: "#1a1a1a" },
] as const;

/* ── Element types ────────────────────────────────────────────────── */

export interface BaseElement {
  id: string;
  zIndex: number;
  groupId?: string;
  locked?: boolean;
}

export interface FreehandStroke extends BaseElement {
  type: "freehand";
  points: PressurePoint[];
  color: string;
  thickness: number;
}

export type ShapeKind = "rect" | "ellipse" | "diamond" | "line" | "arrow";

export interface ShapeElement extends BaseElement {
  type: "shape";
  shapeKind: ShapeKind;
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor: string;
  strokeWidth: number;
  fillColor: string | null;
}

export interface TextElement extends BaseElement {
  type: "text";
  text: string;
  x: number;
  y: number;
  width: number;
  fontSize: number;
  color: string;
}

export interface CodeSnippet extends BaseElement {
  type: "code";
  code: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface StickyNote extends BaseElement {
  type: "sticky";
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string; // background tint
}

export interface LaserTrail {
  id: string;
  type: "laser";
  points: Point[];
  timestamp: number;
}

export type WbElement =
  | FreehandStroke
  | ShapeElement
  | TextElement
  | CodeSnippet
  | StickyNote;

// Laser is ephemeral — not part of WbElement

/* ── View ─────────────────────────────────────────────────────────── */

export interface ViewTransform {
  offsetX: number;
  offsetY: number;
  scale: number;
}

/* ── Board ────────────────────────────────────────────────────────── */

export interface Board {
  id: string;
  name: string;
  elements: WbElement[];
  background: BackgroundKind;
  createdAt: number;
  updatedAt: number;
}

export type BackgroundKind = "none" | "dots" | "grid";

/* ── Selection ────────────────────────────────────────────────────── */

export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/* ── History ──────────────────────────────────────────────────────── */

export interface HistoryEntry {
  elements: WbElement[];
  timestamp: number;
}

/* ── Snap ─────────────────────────────────────────────────────────── */

export interface SnapGuide {
  orientation: "horizontal" | "vertical";
  position: number;
  timestamp: number;
}

export interface SnapResult {
  x: number;
  y: number;
  guides: SnapGuide[];
}

/* ── Helpers ──────────────────────────────────────────────────────── */

let _idCounter = 0;
export function generateId(): string {
  return `wb_${Date.now().toString(36)}_${(++_idCounter).toString(36)}`;
}

export function getElementBounds(el: WbElement): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  switch (el.type) {
    case "freehand": {
      if (el.points.length === 0)
        return { x: 0, y: 0, width: 0, height: 0 };
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      for (const p of el.points) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      };
    }
    case "shape":
    case "code":
    case "sticky":
      return { x: el.x, y: el.y, width: el.width, height: el.height };
    case "text":
      return {
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.fontSize * 1.4,
      };
  }
}
