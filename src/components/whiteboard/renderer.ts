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
  scale: number = 1,
): void {
  ctx.save();
  ctx.scale(1 / scale, 1 / scale);
  ctx.font = `${el.fontSize * scale}px ${FONT_MONO}`;
  ctx.fillStyle = el.color;
  ctx.textBaseline = "top";

  const lines = wrapText(ctx, el.text, el.width * scale);
  let yOff = 0;
  for (const line of lines) {
    ctx.fillText(line, el.x * scale, (el.y + yOff) * scale);
    yOff += el.fontSize;
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
  scale: number = 1,
): void {
  const pad = 16;
  const radius = 8;
  const lineH = 18;
  const baseFontSize = 13;

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
  // Mac-like window dots
  ctx.fillStyle = "oklch(0.72 0.17 25)"; // red
  ctx.beginPath();
  ctx.arc(el.x + 16, el.y + 16, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "oklch(0.76 0.14 75)"; // yellow
  ctx.beginPath();
  ctx.arc(el.x + 30, el.y + 16, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "oklch(0.5 0.15 150)"; // green
  ctx.beginPath();
  ctx.arc(el.x + 44, el.y + 16, 4, 0, Math.PI * 2);
  ctx.fill();

  // Draw text unscaled for crispness
  ctx.scale(1 / scale, 1 / scale);
  const fontSize = 14 * scale;
  ctx.font = `${fontSize}px ${FONT_MONO}`;
  ctx.textBaseline = "top";

  const lines = el.code.split("\n");
  const padX = 16 * scale;
  const padY = 36 * scale;
  let currentY = el.y * scale + padY;

  for (const line of lines) {
    const tokens = tokenizePython(line);
    let currentX = el.x * scale + padX;

    for (const t of tokens) {
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, currentX, currentY);
      currentX += ctx.measureText(t.text).width;
    }
    currentY += fontSize * 1.5;
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
  scale: number = 1,
): void {
  ctx.save();

  // Draw background shadow
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.beginPath();
  ctx.roundRect(el.x + 4, el.y + 6, el.width, el.height, 2);
  ctx.fill();

  // Draw box
  ctx.fillStyle = el.color || "oklch(0.94 0.03 85)";
  ctx.beginPath();
  ctx.roundRect(el.x, el.y, el.width, el.height, 2);
  ctx.fill();

  // Fold effect (top right)
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.beginPath();
  ctx.moveTo(el.x + el.width - 16, el.y);
  ctx.lineTo(el.x + el.width, el.y);
  ctx.lineTo(el.x + el.width, el.y + 16);
  ctx.fill();

  // Draw text unscaled
  ctx.scale(1 / scale, 1 / scale);
  const fontSize = 15 * scale;
  ctx.font = `500 ${fontSize}px var(--font-sans)`;
  ctx.fillStyle = "oklch(0.1 0.02 240)";
  ctx.textBaseline = "top";

  const lines = wrapText(ctx, el.text, (el.width - 24) * scale);
  let yOff = 16 * scale;
  for (const line of lines) {
    ctx.fillText(line, (el.x + 12) * scale, el.y * scale + yOff);
    yOff += fontSize * 1.3;
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

  const now = Date.now();

  for (const g of guides) {
    const age = now - g.timestamp;
    if (age > 150) continue; // max 150ms

    ctx.globalAlpha = 1 - age / 150;

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
  eraserHoverId: string | null = null,
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
    renderElement(ctx, el, view.scale);

    if (selectedIds.has(el.id)) {
      const bounds = getBoundsForSelection(el);
      renderSelectionBox(ctx, bounds, view.scale);
    }

    if (el.id === eraserHoverId) {
      ctx.save();
      const b = getBoundsForSelection(el);
      ctx.strokeStyle = "rgba(255, 50, 50, 0.8)";
      ctx.lineWidth = 2 / view.scale;
      ctx.setLineDash([4 / view.scale, 4 / view.scale]);
      ctx.strokeRect(b.x, b.y, b.width, b.height);
      ctx.restore();
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
  scale: number = 1,
): void {
  switch (el.type) {
    case "freehand":
      renderFreehand(ctx, el);
      break;
    case "shape":
      renderShape(ctx, el);
      break;
    case "text":
      renderText(ctx, el, scale);
      break;
    case "code":
      renderCodeSnippet(ctx, el, scale);
      break;
    case "sticky":
      renderStickyNote(ctx, el, scale);
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
