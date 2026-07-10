/* ── Canvas renderer ──────────────────────────────────────────────── */
/* Pure functions that draw each element type to a Canvas2D context.  */

import type {
  WbElement,
  FreehandStroke,
  ShapeElement,
  TextElement,
  CodeSnippet,
  StickyNote,
  LaserTrail,
  ViewTransform,
  BackgroundKind,
  SnapGuide,
  Point,
} from "./types";

/* ── Colours (resolved at import time) ───────────────────────────── */
const COL_GRID_DOTS = "rgba(30,40,70,0.18)";
const COL_GRID_LINES = "rgba(30,40,70,0.10)";
const COL_SELECTION = "oklch(0.76 0.14 75)";
const COL_SNAP_GUIDE = "oklch(0.66 0.08 175)";
const COL_HANDLE = "#ffffff";

const FONT_MONO = '"JetBrains Mono", monospace';

/* ── Background ──────────────────────────────────────────────────── */

export function renderBackground(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  canvasW: number,
  canvasH: number,
  kind: BackgroundKind,
): void {
  if (kind === "none") return;

  const spacing = 20;
  const startX =
    Math.floor(-view.offsetX / view.scale / spacing) * spacing - spacing;
  const startY =
    Math.floor(-view.offsetY / view.scale / spacing) * spacing - spacing;
  const endX =
    Math.ceil((canvasW - view.offsetX) / view.scale / spacing) * spacing +
    spacing;
  const endY =
    Math.ceil((canvasH - view.offsetY) / view.scale / spacing) * spacing +
    spacing;

  ctx.save();
  ctx.translate(view.offsetX, view.offsetY);
  ctx.scale(view.scale, view.scale);

  if (kind === "dots") {
    ctx.fillStyle = COL_GRID_DOTS;
    const r = 1.2 / view.scale;
    for (let x = startX; x <= endX; x += spacing) {
      for (let y = startY; y <= endY; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (kind === "grid") {
    ctx.strokeStyle = COL_GRID_LINES;
    ctx.lineWidth = 0.5 / view.scale;
    ctx.beginPath();
    for (let x = startX; x <= endX; x += spacing) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += spacing) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();
  }

  ctx.restore();
}

/* ── Freehand stroke (quadratic Bézier smoothing) ────────────────── */

export function renderFreehand(
  ctx: CanvasRenderingContext2D,
  stroke: FreehandStroke,
): void {
  const pts = stroke.points;
  if (pts.length < 2) {
    if (pts.length === 1) {
      ctx.fillStyle = stroke.color;
      ctx.beginPath();
      ctx.arc(pts[0].x, pts[0].y, stroke.thickness / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  ctx.strokeStyle = stroke.color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Variable thickness from pressure
  const hasPressure = pts.some((p) => p.pressure > 0 && p.pressure < 1);

  if (!hasPressure) {
    // Uniform width — one smooth path
    ctx.lineWidth = stroke.thickness;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  } else {
    // Pressure-variable — draw segment by segment
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const avgPressure = (p0.pressure + p1.pressure) / 2;
      ctx.lineWidth = stroke.thickness * Math.max(0.2, avgPressure);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      if (i < pts.length - 2) {
        const p2 = pts[i + 2];
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;
        ctx.quadraticCurveTo(p1.x, p1.y, mx, my);
      } else {
        ctx.lineTo(p1.x, p1.y);
      }
      ctx.stroke();
    }
  }
}

/* ── Shapes ───────────────────────────────────────────────────────── */

export function renderShape(
  ctx: CanvasRenderingContext2D,
  shape: ShapeElement,
): void {
  ctx.save();
  ctx.strokeStyle = shape.strokeColor;
  ctx.lineWidth = shape.strokeWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const { x, y, width: w, height: h } = shape;

  switch (shape.shapeKind) {
    case "rect": {
      if (shape.fillColor) {
        ctx.fillStyle = shape.fillColor;
        ctx.fillRect(x, y, w, h);
      }
      ctx.strokeRect(x, y, w, h);
      break;
    }
    case "ellipse": {
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2);
      if (shape.fillColor) {
        ctx.fillStyle = shape.fillColor;
        ctx.fill();
      }
      ctx.stroke();
      break;
    }
    case "diamond": {
      const cx = x + w / 2;
      const cy = y + h / 2;
      ctx.beginPath();
      ctx.moveTo(cx, y);
      ctx.lineTo(x + w, cy);
      ctx.lineTo(cx, y + h);
      ctx.lineTo(x, cy);
      ctx.closePath();
      if (shape.fillColor) {
        ctx.fillStyle = shape.fillColor;
        ctx.fill();
      }
      ctx.stroke();
      break;
    }
    case "line": {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y + h);
      ctx.stroke();
      break;
    }
    case "arrow": {
      const fromX = x;
      const fromY = y;
      const toX = x + w;
      const toY = y + h;
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();

      // Arrowhead
      const angle = Math.atan2(toY - fromY, toX - fromX);
      const headLen = Math.max(12, shape.strokeWidth * 4);
      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(
        toX - headLen * Math.cos(angle - Math.PI / 6),
        toY - headLen * Math.sin(angle - Math.PI / 6),
      );
      ctx.moveTo(toX, toY);
      ctx.lineTo(
        toX - headLen * Math.cos(angle + Math.PI / 6),
        toY - headLen * Math.sin(angle + Math.PI / 6),
      );
      ctx.stroke();
      break;
    }
  }
  ctx.restore();
}

/* ── Text ─────────────────────────────────────────────────────────── */

export function renderText(
  ctx: CanvasRenderingContext2D,
  el: TextElement,
): void {
  ctx.save();
  ctx.font = `${el.fontSize}px ${FONT_MONO}`;
  ctx.fillStyle = el.color;
  ctx.textBaseline = "top";

  const lines = wrapText(ctx, el.text, el.width);
  let yOff = 0;
  for (const line of lines) {
    ctx.fillText(line, el.x, el.y + yOff);
    yOff += el.fontSize * 1.4;
  }
  ctx.restore();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  if (maxWidth <= 0) return [text];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? current + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

/* ── Code snippet block ──────────────────────────────────────────── */

// Simple Python keyword highlighting
const PY_KEYWORDS = new Set([
  "def",
  "class",
  "return",
  "if",
  "elif",
  "else",
  "for",
  "while",
  "import",
  "from",
  "as",
  "try",
  "except",
  "finally",
  "raise",
  "with",
  "yield",
  "lambda",
  "pass",
  "break",
  "continue",
  "and",
  "or",
  "not",
  "in",
  "is",
  "None",
  "True",
  "False",
  "print",
  "self",
  "async",
  "await",
]);

export function renderCodeSnippet(
  ctx: CanvasRenderingContext2D,
  el: CodeSnippet,
): void {
  const pad = 16;
  const radius = 8;
  const lineH = 18;
  const fontSize = 13;

  // Dark background with rounded corners
  ctx.save();
  ctx.fillStyle = "oklch(0.14 0.02 240)";
  roundRect(ctx, el.x, el.y, el.width, el.height, radius);
  ctx.fill();

  // Subtle border
  ctx.strokeStyle = "oklch(0.28 0.02 240)";
  ctx.lineWidth = 1;
  roundRect(ctx, el.x, el.y, el.width, el.height, radius);
  ctx.stroke();

  // Title bar line
  ctx.fillStyle = "oklch(0.19 0.02 240)";
  roundRect(ctx, el.x, el.y, el.width, 28, radius);
  ctx.fill();
  ctx.fillStyle = "oklch(0.5 0.02 240)";
  ctx.font = `500 11px ${FONT_MONO}`;
  ctx.textBaseline = "middle";
  ctx.fillText("python", el.x + pad, el.y + 14);

  // Three window dots
  const dotY = el.y + 14;
  const dotStartX = el.x + el.width - pad - 30;
  [
    "oklch(0.72 0.17 25)",
    "oklch(0.76 0.14 75)",
    "oklch(0.66 0.08 175)",
  ].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(dotStartX + i * 14, dotY, 3.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Code lines
  ctx.font = `${fontSize}px ${FONT_MONO}`;
  ctx.textBaseline = "top";
  const lines = el.code.split("\n");
  const maxLines = Math.floor((el.height - 36 - pad) / lineH);

  for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
    const lineY = el.y + 36 + i * lineH;
    const line = lines[i];

    // Simple token-based coloring
    const tokens = tokenizePython(line);
    let xOff = el.x + pad;
    for (const token of tokens) {
      ctx.fillStyle = token.color;
      ctx.fillText(token.text, xOff, lineY);
      xOff += ctx.measureText(token.text).width;
    }
  }

  ctx.restore();
}

interface Token {
  text: string;
  color: string;
}

function tokenizePython(line: string): Token[] {
  const tokens: Token[] = [];
  // Very simple tokenizer — split by word boundaries
  const parts = line.split(/(\s+|[()[\]{},:.=+\-*/<>!]+|"[^"]*"|'[^']*'|#.*$)/);

  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith("#")) {
      tokens.push({ text: part, color: "oklch(0.5 0.02 240)" }); // comment
    } else if (part.startsWith('"') || part.startsWith("'")) {
      tokens.push({ text: part, color: "oklch(0.66 0.08 175)" }); // string (teal)
    } else if (PY_KEYWORDS.has(part)) {
      tokens.push({ text: part, color: "oklch(0.76 0.14 75)" }); // keyword (amber)
    } else if (/^\d+(\.\d+)?$/.test(part)) {
      tokens.push({ text: part, color: "oklch(0.72 0.17 25)" }); // number (coral)
    } else {
      tokens.push({ text: part, color: "oklch(0.88 0.015 85)" }); // default (warm off)
    }
  }
  return tokens;
}

/* ── Sticky note ─────────────────────────────────────────────────── */

export function renderStickyNote(
  ctx: CanvasRenderingContext2D,
  el: StickyNote,
): void {
  ctx.save();

  // Drop shadow
  ctx.shadowColor = "rgba(0,0,0,0.15)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 3;

  ctx.fillStyle = el.color || "oklch(0.94 0.03 85)";
  roundRect(ctx, el.x, el.y, el.width, el.height, 4);
  ctx.fill();

  // Reset shadow for text
  ctx.shadowColor = "transparent";

  // Text
  ctx.font = `14px ${FONT_MONO}`;
  ctx.fillStyle = "oklch(0.22 0.01 120)";
  ctx.textBaseline = "top";
  const lines = wrapText(ctx, el.text, el.width - 20);
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], el.x + 10, el.y + 10 + i * 20);
  }

  ctx.restore();
}

/* ── Laser trail ─────────────────────────────────────────────────── */

export function renderLaserTrails(
  ctx: CanvasRenderingContext2D,
  trails: LaserTrail[],
): void {
  const now = Date.now();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const trail of trails) {
    const age = now - trail.timestamp;
    if (age > 1500) continue;

    const pts = trail.points;
    if (pts.length < 2) continue;

    const globalAlpha = Math.max(0, 1 - age / 1500);

    // Outer glow
    ctx.save();
    ctx.globalAlpha = globalAlpha * 0.3;
    ctx.strokeStyle = "oklch(0.72 0.17 25)";
    ctx.lineWidth = 12;
    drawSmoothLine(ctx, pts);
    ctx.stroke();

    // Inner bright line
    ctx.globalAlpha = globalAlpha;
    ctx.strokeStyle = "oklch(0.9 0.15 25)";
    ctx.lineWidth = 3;
    drawSmoothLine(ctx, pts);
    ctx.stroke();
    ctx.restore();
  }
}

function drawSmoothLine(ctx: CanvasRenderingContext2D, pts: Point[]): void {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
  }
  const last = pts[pts.length - 1];
  ctx.lineTo(last.x, last.y);
}

/* ── Selection handles ───────────────────────────────────────────── */

export function renderSelectionBox(
  ctx: CanvasRenderingContext2D,
  bounds: { x: number; y: number; width: number; height: number },
  scale: number,
): void {
  const { x, y, width: w, height: h } = bounds;
  ctx.save();

  // Dashed outline
  ctx.strokeStyle = COL_SELECTION;
  ctx.lineWidth = 1.5 / scale;
  ctx.setLineDash([6 / scale, 4 / scale]);
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);

  // Corner handles
  const hs = 6 / scale;
  const corners = [
    { x: x - hs / 2, y: y - hs / 2 },
    { x: x + w - hs / 2, y: y - hs / 2 },
    { x: x - hs / 2, y: y + h - hs / 2 },
    { x: x + w - hs / 2, y: y + h - hs / 2 },
  ];

  for (const c of corners) {
    ctx.fillStyle = COL_HANDLE;
    ctx.strokeStyle = COL_SELECTION;
    ctx.lineWidth = 1.5 / scale;
    ctx.fillRect(c.x, c.y, hs, hs);
    ctx.strokeRect(c.x, c.y, hs, hs);
  }

  ctx.restore();
}

/** Drag-selection rectangle (blue tinted). */
export function renderDragSelect(
  ctx: CanvasRenderingContext2D,
  rect: { x: number; y: number; width: number; height: number },
): void {
  ctx.save();
  ctx.fillStyle = "rgba(200,170,80,0.08)";
  ctx.strokeStyle = COL_SELECTION;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
  ctx.setLineDash([]);
  ctx.restore();
}

/* ── Alignment snap guides ───────────────────────────────────────── */

export function renderSnapGuides(
  ctx: CanvasRenderingContext2D,
  guides: SnapGuide[],
  view: ViewTransform,
  canvasW: number,
  canvasH: number,
): void {
  if (guides.length === 0) return;
  ctx.save();
  ctx.strokeStyle = COL_SNAP_GUIDE;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);

  for (const g of guides) {
    ctx.beginPath();
    if (g.orientation === "vertical") {
      const sx = g.position * view.scale + view.offsetX;
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, canvasH);
    } else {
      const sy = g.position * view.scale + view.offsetY;
      ctx.moveTo(0, sy);
      ctx.lineTo(canvasW, sy);
    }
    ctx.stroke();
  }

  ctx.setLineDash([]);
  ctx.restore();
}

/* ── Full scene render ───────────────────────────────────────────── */

export function renderScene(
  ctx: CanvasRenderingContext2D,
  elements: WbElement[],
  view: ViewTransform,
  canvasW: number,
  canvasH: number,
  bg: BackgroundKind,
  selectedIds: Set<string>,
  laserTrails: LaserTrail[],
  snapGuides: SnapGuide[],
): void {
  // Clear
  ctx.clearRect(0, 0, canvasW, canvasH);

  // Background
  renderBackground(ctx, view, canvasW, canvasH, bg);

  // Elements (sorted by zIndex)
  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  ctx.save();
  ctx.translate(view.offsetX, view.offsetY);
  ctx.scale(view.scale, view.scale);

  for (const el of sorted) {
    renderElement(ctx, el);

    if (selectedIds.has(el.id)) {
      const bounds = getBoundsForSelection(el);
      renderSelectionBox(ctx, bounds, view.scale);
    }
  }

  // Laser trails (in world space)
  renderLaserTrails(ctx, laserTrails);

  ctx.restore();

  // Snap guides (in screen space)
  renderSnapGuides(ctx, snapGuides, view, canvasW, canvasH);
}

export function renderElement(
  ctx: CanvasRenderingContext2D,
  el: WbElement,
): void {
  switch (el.type) {
    case "freehand":
      renderFreehand(ctx, el);
      break;
    case "shape":
      renderShape(ctx, el);
      break;
    case "text":
      renderText(ctx, el);
      break;
    case "code":
      renderCodeSnippet(ctx, el);
      break;
    case "sticky":
      renderStickyNote(ctx, el);
      break;
  }
}

function getBoundsForSelection(el: WbElement): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (el.type === "freehand") {
    const pts = el.points;
    if (pts.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const p of pts) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    const pad = el.thickness / 2 + 4;
    return {
      x: minX - pad,
      y: minY - pad,
      width: maxX - minX + pad * 2,
      height: maxY - minY + pad * 2,
    };
  }
  if (el.type === "text") {
    return { x: el.x - 4, y: el.y - 4, width: el.width + 8, height: el.fontSize * 1.4 + 8 };
  }
  return {
    x: el.x - 4,
    y: el.y - 4,
    width: el.width + 8,
    height: el.height + 8,
  };
}

/* ── Utility ─────────────────────────────────────────────────────── */

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
