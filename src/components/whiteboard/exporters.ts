/* ── Export: PNG and SVG ──────────────────────────────────────────── */

import type { WbElement, ViewTransform } from "./types";
import { getElementBounds } from "./types";
import { renderElement } from "./renderer";

interface ExportPNGOptions {
  scale: 2 | 3;
  background: "transparent" | "parchment";
}

/**
 * Render all elements to an offscreen canvas and trigger a download.
 */
export function exportPNG(
  elements: WbElement[],
  options: ExportPNGOptions,
): void {
  if (elements.length === 0) return;

  const { bounds, padding } = computeExportBounds(elements);
  const w = (bounds.width + padding * 2) * options.scale;
  const h = (bounds.height + padding * 2) * options.scale;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  if (options.background === "parchment") {
    ctx.fillStyle = "oklch(0.955 0.02 85)";
    ctx.fillRect(0, 0, w, h);
  }

  ctx.scale(options.scale, options.scale);
  ctx.translate(-bounds.x + padding, -bounds.y + padding);

  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
  for (const el of sorted) {
    renderElement(ctx, el);
  }

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `whiteboard-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

/**
 * Generate an SVG string from elements and trigger a download.
 */
export function exportSVG(elements: WbElement[]): void {
  if (elements.length === 0) return;

  const { bounds, padding } = computeExportBounds(elements);
  const w = bounds.width + padding * 2;
  const h = bounds.height + padding * 2;
  const ox = -bounds.x + padding;
  const oy = -bounds.y + padding;

  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
  const parts: string[] = [];

  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
  );
  parts.push(
    `<style>text, tspan { font-family: "JetBrains Mono", monospace; }</style>`,
  );
  parts.push(`<g transform="translate(${ox},${oy})">`);

  for (const el of sorted) {
    parts.push(elementToSVG(el));
  }

  parts.push("</g></svg>");

  const blob = new Blob([parts.join("\n")], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `whiteboard-${Date.now()}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

function computeExportBounds(elements: WbElement[]): {
  bounds: { x: number; y: number; width: number; height: number };
  padding: number;
} {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (const el of elements) {
    const b = getElementBounds(el);
    if (b.x < minX) minX = b.x;
    if (b.y < minY) minY = b.y;
    if (b.x + b.width > maxX) maxX = b.x + b.width;
    if (b.y + b.height > maxY) maxY = b.y + b.height;
  }

  return {
    bounds: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
    padding: 40,
  };
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function elementToSVG(el: WbElement): string {
  switch (el.type) {
    case "freehand": {
      const pts = el.points;
      if (pts.length < 2) return "";
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i].x + pts[i + 1].x) / 2;
        const my = (pts[i].y + pts[i + 1].y) / 2;
        d += ` Q ${pts[i].x} ${pts[i].y} ${mx} ${my}`;
      }
      const last = pts[pts.length - 1];
      d += ` L ${last.x} ${last.y}`;
      return `<path d="${d}" fill="none" stroke="${el.color}" stroke-width="${el.thickness}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    case "shape": {
      const fill = el.fillColor ? `fill="${el.fillColor}"` : `fill="none"`;
      const stroke = `stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}"`;

      switch (el.shapeKind) {
        case "rect":
          return `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" ${fill} ${stroke}/>`;
        case "ellipse":
          return `<ellipse cx="${el.x + el.width / 2}" cy="${el.y + el.height / 2}" rx="${Math.abs(el.width / 2)}" ry="${Math.abs(el.height / 2)}" ${fill} ${stroke}/>`;
        case "diamond": {
          const cx = el.x + el.width / 2;
          const cy = el.y + el.height / 2;
          return `<polygon points="${cx},${el.y} ${el.x + el.width},${cy} ${cx},${el.y + el.height} ${el.x},${cy}" ${fill} ${stroke}/>`;
        }
        case "line":
          return `<line x1="${el.x}" y1="${el.y}" x2="${el.x + el.width}" y2="${el.y + el.height}" ${stroke} stroke-linecap="round"/>`;
        case "arrow": {
          const tx = el.x + el.width;
          const ty = el.y + el.height;
          const angle = Math.atan2(ty - el.y, tx - el.x);
          const hl = Math.max(12, el.strokeWidth * 4);
          const ax1 = tx - hl * Math.cos(angle - Math.PI / 6);
          const ay1 = ty - hl * Math.sin(angle - Math.PI / 6);
          const ax2 = tx - hl * Math.cos(angle + Math.PI / 6);
          const ay2 = ty - hl * Math.sin(angle + Math.PI / 6);
          return `<g><line x1="${el.x}" y1="${el.y}" x2="${tx}" y2="${ty}" ${stroke} stroke-linecap="round"/><line x1="${tx}" y1="${ty}" x2="${ax1}" y2="${ay1}" ${stroke} stroke-linecap="round"/><line x1="${tx}" y1="${ty}" x2="${ax2}" y2="${ay2}" ${stroke} stroke-linecap="round"/></g>`;
        }
      }
      break;
    }
    case "text":
      return `<text x="${el.x}" y="${el.y + el.fontSize}" font-size="${el.fontSize}" fill="${el.color}">${escapeXml(el.text)}</text>`;
    case "code":
      return `<g><rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="8" fill="oklch(0.14 0.02 240)" stroke="oklch(0.28 0.02 240)"/><text x="${el.x + 16}" y="${el.y + 44}" font-size="13" fill="oklch(0.88 0.015 85)">${escapeXml(el.code.split("\n").slice(0, 5).join("  |  "))}</text></g>`;
    case "sticky":
      return `<g><rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="4" fill="${el.color || "oklch(0.94 0.03 85)"}" filter="drop-shadow(2px 3px 4px rgba(0,0,0,0.12))"/><text x="${el.x + 10}" y="${el.y + 24}" font-size="14" fill="oklch(0.22 0.01 120)">${escapeXml(el.text)}</text></g>`;
  }
  return "";
}
