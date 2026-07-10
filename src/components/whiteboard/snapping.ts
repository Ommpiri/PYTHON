/* ── Snapping engine ──────────────────────────────────────────────── */

import type { WbElement, SnapResult, SnapGuide, Point } from "./types";
import { getElementBounds } from "./types";

const GRID_SIZE = 20;
const SNAP_THRESHOLD = 8; // pixels in screen space

/** Snap a point to the nearest grid intersection. */
export function snapToGrid(p: Point, scale: number): Point {
  const threshold = SNAP_THRESHOLD / scale;
  const gx = Math.round(p.x / GRID_SIZE) * GRID_SIZE;
  const gy = Math.round(p.y / GRID_SIZE) * GRID_SIZE;
  return {
    x: Math.abs(p.x - gx) < threshold ? gx : p.x,
    y: Math.abs(p.y - gy) < threshold ? gy : p.y,
  };
}

/**
 * Snap the bounding box of a dragged element against all other elements.
 * Returns the adjusted position + any alignment guide lines to draw.
 */
export function snapToElements(
  dragBounds: { x: number; y: number; width: number; height: number },
  otherElements: WbElement[],
  scale: number,
): SnapResult {
  const threshold = SNAP_THRESHOLD / scale;
  const guides: SnapGuide[] = [];

  let bestDx = Infinity;
  let bestDy = Infinity;
  let snapX = dragBounds.x;
  let snapY = dragBounds.y;

  const dragCX = dragBounds.x + dragBounds.width / 2;
  const dragCY = dragBounds.y + dragBounds.height / 2;
  const dragRight = dragBounds.x + dragBounds.width;
  const dragBottom = dragBounds.y + dragBounds.height;

  for (const el of otherElements) {
    const b = getElementBounds(el);
    const oCX = b.x + b.width / 2;
    const oCY = b.y + b.height / 2;
    const oRight = b.x + b.width;
    const oBottom = b.y + b.height;

    // Vertical alignment checks (snap X)
    const xChecks = [
      { drag: dragBounds.x, other: b.x }, // left-to-left
      { drag: dragBounds.x, other: oRight }, // left-to-right
      { drag: dragRight, other: b.x }, // right-to-left
      { drag: dragRight, other: oRight }, // right-to-right
      { drag: dragCX, other: oCX }, // center-to-center
    ];

    for (const { drag, other } of xChecks) {
      const dist = Math.abs(drag - other);
      if (dist < threshold && dist < Math.abs(bestDx)) {
        bestDx = other - drag;
        snapX = dragBounds.x + bestDx;
        // Add a vertical guide at this x position
        guides.push({ orientation: "vertical", position: other });
      }
    }

    // Horizontal alignment checks (snap Y)
    const yChecks = [
      { drag: dragBounds.y, other: b.y }, // top-to-top
      { drag: dragBounds.y, other: oBottom }, // top-to-bottom
      { drag: dragBottom, other: b.y }, // bottom-to-top
      { drag: dragBottom, other: oBottom }, // bottom-to-bottom
      { drag: dragCY, other: oCY }, // center-to-center
    ];

    for (const { drag, other } of yChecks) {
      const dist = Math.abs(drag - other);
      if (dist < threshold && dist < Math.abs(bestDy)) {
        bestDy = other - drag;
        snapY = dragBounds.y + bestDy;
        guides.push({ orientation: "horizontal", position: other });
      }
    }
  }

  return { x: snapX, y: snapY, guides };
}

/** Combined grid + element snapping. Grid takes priority when active. */
export function snap(
  point: Point,
  bounds: { width: number; height: number } | null,
  elements: WbElement[],
  excludeIds: Set<string>,
  scale: number,
  gridEnabled: boolean,
): SnapResult {
  const others = elements.filter((e) => !excludeIds.has(e.id));

  if (bounds) {
    // Snap a bounding box (dragging a shape)
    const result = snapToElements(
      { x: point.x, y: point.y, width: bounds.width, height: bounds.height },
      others,
      scale,
    );

    if (gridEnabled) {
      const gridSnapped = snapToGrid(
        { x: result.x, y: result.y },
        scale,
      );
      return { ...result, x: gridSnapped.x, y: gridSnapped.y };
    }

    return result;
  }

  // Snap a single point
  if (gridEnabled) {
    const gs = snapToGrid(point, scale);
    return { x: gs.x, y: gs.y, guides: [] };
  }

  return { x: point.x, y: point.y, guides: [] };
}
