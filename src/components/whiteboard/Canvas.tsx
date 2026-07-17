/* ── Whiteboard Canvas ────────────────────────────────────────────── */
/* Dual-layer canvas with pointer events, pan/zoom, and rAF loop.    */

import { useRef, useEffect, useCallback, useState, type RefObject } from "react";
import type {
  WbElement,
  ViewTransform,
  Tool,
  FreehandStroke,
  ShapeElement,
  TextElement,
  CodeSnippet,
  StickyNote,
  LaserTrail,
  PressurePoint,
  Point,
  BackgroundKind,
  SnapGuide,
} from "./types";
import { generateId, getElementBounds } from "./types";
import { renderScene, renderDragSelect } from "./renderer";
import { snap } from "./snapping";

export interface CanvasProps {
  elements: WbElement[];
  setElements: (fn: (prev: WbElement[]) => WbElement[]) => void;
  selectedIds: Set<string>;
  setSelectedIds: (ids: Set<string>) => void;
  tool: Tool;
  view: ViewTransform;
  setView: (fn: (v: ViewTransform) => ViewTransform) => void;
  background: BackgroundKind;
  penColor: string;
  penThickness: number;
  shapeStrokeColor: string;
  shapeStrokeWidth: number;
  shapeFillColor: string | null;
  laserTrails: LaserTrail[];
  setLaserTrails: (fn: (t: LaserTrail[]) => LaserTrail[]) => void;
  snapGuides: SnapGuide[];
  setSnapGuides: (g: SnapGuide[]) => void;
  pushHistory: () => void;
  presentMode: boolean;
  onTextCreate: (x: number, y: number) => void;
  onCodeCreate: (x: number, y: number) => void;
  onStickyCreate: (x: number, y: number) => void;
  containerRef: RefObject<HTMLDivElement | null>;
}

export function Canvas({
  elements,
  setElements,
  selectedIds,
  setSelectedIds,
  tool,
  view,
  setView,
  background,
  penColor,
  penThickness,
  shapeStrokeColor,
  shapeStrokeWidth,
  shapeFillColor,
  laserTrails,
  setLaserTrails,
  snapGuides,
  setSnapGuides,
  pushHistory,
  presentMode,
  onTextCreate,
  onCodeCreate,
  onStickyCreate,
  containerRef,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dirtyRef = useRef(true);
  const drawingRef = useRef(false);
  const currentStrokeRef = useRef<PressurePoint[]>([]);
  const shapeStartRef = useRef<Point | null>(null);
  const dragStartRef = useRef<{ elemId: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const panStartRef = useRef<Point | null>(null);
  const selectRectRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const isPanningRef = useRef(false);
  const spaceDownRef = useRef(false);
  const [eraserHoverId, setEraserHoverId] = useState<string | null>(null);
  const activeLaserIdRef = useRef<string | null>(null);

  // Mark canvas dirty whenever state changes
  const markDirty = useCallback(() => {
    dirtyRef.current = true;
  }, []);

  useEffect(markDirty, [elements, selectedIds, view, background, laserTrails, snapGuides, eraserHoverId, markDirty]);

  // Convert screen coords to world coords
  const screenToWorld = useCallback(
    (sx: number, sy: number): Point => ({
      x: (sx - view.offsetX) / view.scale,
      y: (sy - view.offsetY) / view.scale,
    }),
    [view],
  );

  // ── rAF render loop ──────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let rafId: number;

    const loop = () => {
      if (dirtyRef.current) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        const w = rect.width * dpr;
        const h = rect.height * dpr;
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        renderScene(
          ctx,
          elements,
          view,
          canvas.width,
          canvas.height,
          background,
          selectedIds,
          laserTrails,
          snapGuides,
          eraserHoverId,
        );

        // Draw in-progress shapes
        if (shapeStartRef.current && drawingRef.current) {
          // Handled via elements (temporary shape added)
        }

        // Draw drag-select rectangle
        if (selectRectRef.current) {
          ctx.save();
          ctx.translate(view.offsetX, view.offsetY);
          ctx.scale(view.scale, view.scale);
          renderDragSelect(ctx, selectRectRef.current);
          ctx.restore();
        }

        dirtyRef.current = false;
      }
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [elements, view, background, selectedIds, laserTrails, snapGuides]);

  // ── Resize observer ──────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obs = new ResizeObserver(() => {
      dirtyRef.current = true;
    });
    obs.observe(canvas);
    return () => obs.disconnect();
  }, []);

  // ── Hit testing ──────────────────────────────────────
  const hitTest = useCallback(
    (worldPt: Point): WbElement | null => {
      // Reverse order (top-most first)
      const sorted = [...elements].sort((a, b) => b.zIndex - a.zIndex);
      for (const el of sorted) {
        const b = getElementBounds(el);
        const pad = el.type === "freehand" ? (el as FreehandStroke).thickness / 2 + 6 : 6;
        if (
          worldPt.x >= b.x - pad &&
          worldPt.x <= b.x + b.width + pad &&
          worldPt.y >= b.y - pad &&
          worldPt.y <= b.y + b.height + pad
        ) {
          return el;
        }
      }
      return null;
    },
    [elements],
  );

  // ── Pointer down ─────────────────────────────────────
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.setPointerCapture(e.pointerId);

      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const world = screenToWorld(sx, sy);

      // Pan with middle mouse, or space+click
      if (e.button === 1 || spaceDownRef.current) {
        isPanningRef.current = true;
        panStartRef.current = { x: e.clientX, y: e.clientY };
        return;
      }

      if (e.button !== 0) return;

      switch (tool) {
        case "pen": {
          drawingRef.current = true;
          const pressure = e.pressure > 0 ? e.pressure : 0.5;
          currentStrokeRef.current = [{ ...world, pressure }];
          break;
        }
        case "laser": {
          drawingRef.current = true;
          const pressure = e.pressure > 0 ? e.pressure : 0.5;
          currentStrokeRef.current = [{ ...world, pressure }];
          activeLaserIdRef.current = generateId();
          break;
        }
        case "line":
        case "arrow":
        case "rect":
        case "ellipse":
        case "diamond": {
          drawingRef.current = true;
          shapeStartRef.current = world;
          break;
        }
        case "select": {
          const hit = hitTest(world);
          if (hit) {
            if (!selectedIds.has(hit.id)) {
              setSelectedIds(new Set([hit.id]));
            }
            dragStartRef.current = {
              elemId: hit.id,
              startX: world.x,
              startY: world.y,
              origX: world.x,
              origY: world.y,
            };
          } else {
            setSelectedIds(new Set());
            selectRectRef.current = { x: world.x, y: world.y, width: 0, height: 0 };
            drawingRef.current = true;
          }
          break;
        }
        case "eraser": {
          const hit = hitTest(world);
          if (hit) {
            pushHistory();
            setElements((prev) => prev.filter((el) => el.id !== hit.id));
          }
          break;
        }
        case "text": {
          onTextCreate(world.x, world.y);
          break;
        }
        case "code": {
          onCodeCreate(world.x, world.y);
          break;
        }
        case "sticky": {
          onStickyCreate(world.x, world.y);
          break;
        }
        case "laser": {
          drawingRef.current = true;
          currentStrokeRef.current = [{ ...world, pressure: 0.5 }];
          break;
        }
      }
      dirtyRef.current = true;
    },
    [tool, screenToWorld, hitTest, selectedIds, setSelectedIds, pushHistory, setElements, onTextCreate, onCodeCreate, onStickyCreate],
  );

  // ── Pointer move ─────────────────────────────────────
  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const world = screenToWorld(sx, sy);

      // Panning
      if (isPanningRef.current && panStartRef.current) {
        setView((v) => ({
          ...v,
          offsetX: v.offsetX + (e.clientX - panStartRef.current!.x),
          offsetY: v.offsetY + (e.clientY - panStartRef.current!.y),
        }));
        panStartRef.current = { x: e.clientX, y: e.clientY };
        return;
      }

      if (!drawingRef.current && !dragStartRef.current) {
        // Update cursor
        if (tool === "select") {
          const hit = hitTest(world);
          canvas.style.cursor = hit ? "move" : "default";
        } else if (tool === "eraser") {
          const hit = hitTest(world);
          setEraserHoverId(hit ? hit.id : null);
          canvas.style.cursor = hit ? "crosshair" : "default";
        } else {
          setEraserHoverId(null);
        }
        return;
      }

      switch (tool) {
        case "pen": {
          const pressure = e.pressure > 0 ? e.pressure : 0.5;
          currentStrokeRef.current.push({ ...world, pressure });
          // Render the in-progress stroke by adding a temporary element
          const tempStroke: FreehandStroke = {
            id: "__temp_pen__",
            type: "freehand",
            points: [...currentStrokeRef.current],
            color: penColor,
            thickness: penThickness,
            zIndex: 999999,
          };
          setElements((prev) => {
            const without = prev.filter((el) => el.id !== "__temp_pen__");
            return [...without, tempStroke];
          });
          break;
        }
        case "line":
        case "arrow":
        case "rect":
        case "ellipse":
        case "diamond": {
          if (!shapeStartRef.current) break;
          const s = shapeStartRef.current;
          const tempShape: ShapeElement = {
            id: "__temp_shape__",
            type: "shape",
            shapeKind: tool,
            x: Math.min(s.x, world.x),
            y: Math.min(s.y, world.y),
            width: tool === "line" || tool === "arrow" ? world.x - s.x : Math.abs(world.x - s.x),
            height: tool === "line" || tool === "arrow" ? world.y - s.y : Math.abs(world.y - s.y),
            strokeColor: shapeStrokeColor,
            strokeWidth: shapeStrokeWidth,
            fillColor: shapeFillColor,
            zIndex: 999999,
          };
          if (tool === "line" || tool === "arrow") {
            tempShape.x = s.x;
            tempShape.y = s.y;
          }
          setElements((prev) => {
            const without = prev.filter((el) => el.id !== "__temp_shape__");
            return [...without, tempShape];
          });
          break;
        }
        case "select": {
          if (dragStartRef.current) {
            // Move selected elements
            const dx = world.x - dragStartRef.current.startX;
            const dy = world.y - dragStartRef.current.startY;

            setElements((prev) =>
              prev.map((el) => {
                if (!selectedIds.has(el.id)) return el;
                if (el.type === "freehand") {
                  return {
                    ...el,
                    points: el.points.map((p) => ({
                      ...p,
                      x: p.x + dx,
                      y: p.y + dy,
                    })),
                  };
                }
                return {
                  ...el,
                  x: (el as any).x + dx,
                  y: (el as any).y + dy,
                };
              }),
            );
            dragStartRef.current.startX = world.x;
            dragStartRef.current.startY = world.y;
            setSnapGuides([]);
          } else if (selectRectRef.current) {
            // Update drag-select rectangle
            const sr = selectRectRef.current;
            selectRectRef.current = {
              x: Math.min(sr.x, world.x),
              y: Math.min(sr.y, world.y),
              width: Math.abs(world.x - sr.x),
              height: Math.abs(world.y - sr.y),
            };
            // Keep original corner stored
            selectRectRef.current = {
              x: sr.x,
              y: sr.y,
              width: world.x - sr.x,
              height: world.y - sr.y,
            };
          }
          break;
        }
        case "laser": {
          currentStrokeRef.current.push({ ...world, pressure: 0.5 });
          if (!activeLaserIdRef.current) break;
          setLaserTrails((prev) => {
            const others = prev.filter((t) => t.id !== activeLaserIdRef.current);
            const current: LaserTrail = {
              id: activeLaserIdRef.current!,
              type: "laser",
              points: [...currentStrokeRef.current],
              timestamp: Date.now(),
            };
            return [...others, current];
          });
          break;
        }
      }
      dirtyRef.current = true;
    },
    [
      tool,
      screenToWorld,
      hitTest,
      penColor,
      penThickness,
      shapeStrokeColor,
      shapeStrokeWidth,
      shapeFillColor,
      selectedIds,
      setElements,
      setView,
      setLaserTrails,
      setSnapGuides,
    ],
  );

  // ── Pointer up ───────────────────────────────────────
  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.releasePointerCapture(e.pointerId);

      if (isPanningRef.current) {
        isPanningRef.current = false;
        panStartRef.current = null;
        return;
      }

      if (dragStartRef.current) {
        // Finished moving — push history
        if (
          dragStartRef.current.origX !== dragStartRef.current.startX ||
          dragStartRef.current.origY !== dragStartRef.current.startY
        ) {
          pushHistory();
        }
        dragStartRef.current = null;
        setSnapGuides([]);
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const world = screenToWorld(
        e.clientX - rect.left,
        e.clientY - rect.top,
      );

      switch (tool) {
        case "pen": {
          if (currentStrokeRef.current.length > 0) {
            pushHistory();
            const newStroke: FreehandStroke = {
              id: generateId(),
              type: "freehand",
              points: [...currentStrokeRef.current],
              color: penColor,
              thickness: penThickness,
              zIndex: elements.length,
            };
            setElements((prev) => [
              ...prev.filter((el) => el.id !== "__temp_pen__"),
              newStroke,
            ]);
          }
          break;
        }
        case "line":
        case "arrow":
        case "rect":
        case "ellipse":
        case "diamond": {
          if (shapeStartRef.current) {
            const s = shapeStartRef.current;
            const isLineType = tool === "line" || tool === "arrow";
            pushHistory();
            const newShape: ShapeElement = {
              id: generateId(),
              type: "shape",
              shapeKind: tool,
              x: isLineType ? s.x : Math.min(s.x, world.x),
              y: isLineType ? s.y : Math.min(s.y, world.y),
              width: isLineType ? world.x - s.x : Math.abs(world.x - s.x),
              height: isLineType ? world.y - s.y : Math.abs(world.y - s.y),
              strokeColor: shapeStrokeColor,
              strokeWidth: shapeStrokeWidth,
              fillColor: shapeFillColor,
              zIndex: elements.length,
            };
            setElements((prev) => [
              ...prev.filter((el) => el.id !== "__temp_shape__"),
              newShape,
            ]);
          }
          break;
        }
        case "select": {
          if (selectRectRef.current) {
            // Select all elements within the rect
            const sr = selectRectRef.current;
            const rx = Math.min(sr.x, sr.x + sr.width);
            const ry = Math.min(sr.y, sr.y + sr.height);
            const rw = Math.abs(sr.width);
            const rh = Math.abs(sr.height);

            if (rw > 4 || rh > 4) {
              const ids = new Set<string>();
              for (const el of elements) {
                const b = getElementBounds(el);
                if (
                  b.x >= rx &&
                  b.y >= ry &&
                  b.x + b.width <= rx + rw &&
                  b.y + b.height <= ry + rh
                ) {
                  ids.add(el.id);
                }
              }
              setSelectedIds(ids);
            }
            selectRectRef.current = null;
          }
          break;
        }
        case "laser": {
          activeLaserIdRef.current = null;
          break;
        }
      }

      drawingRef.current = false;
      currentStrokeRef.current = [];
      shapeStartRef.current = null;
      dirtyRef.current = true;
    },
    [
      tool,
      elements,
      penColor,
      penThickness,
      shapeStrokeColor,
      shapeStrokeWidth,
      shapeFillColor,
      screenToWorld,
      pushHistory,
      setElements,
      setSelectedIds,
      setLaserTrails,
      setSnapGuides,
    ],
  );

  // ── Wheel (zoom + pan) ──────────────────────────────
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        // Zoom
        e.preventDefault();
        const rect = canvasRef.current!.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;

        setView((v) => {
          const factor = e.deltaY > 0 ? 0.92 : 1.08;
          const newScale = Math.min(5, Math.max(0.1, v.scale * factor));
          const ratio = newScale / v.scale;
          return {
            scale: newScale,
            offsetX: sx - (sx - v.offsetX) * ratio,
            offsetY: sy - (sy - v.offsetY) * ratio,
          };
        });
      } else {
        // Pan
        setView((v) => ({
          ...v,
          offsetX: v.offsetX - e.deltaX,
          offsetY: v.offsetY - e.deltaY,
        }));
      }
    },
    [setView],
  );

  // ── Space key for panning ───────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        spaceDownRef.current = true;
        if (canvasRef.current) canvasRef.current.style.cursor = "grab";
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spaceDownRef.current = false;
        if (canvasRef.current) canvasRef.current.style.cursor = "";
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // Tool-specific cursor
  const getCursor = (): string => {
    if (spaceDownRef.current) return "grab";
    switch (tool) {
      case "pen":
        return "crosshair";
      case "line":
      case "arrow":
      case "rect":
      case "ellipse":
      case "diamond":
        return "crosshair";
      case "text":
        return "text";
      case "eraser":
        return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Ccircle cx='10' cy='10' r='8' fill='none' stroke='%23e8a946' stroke-width='2'/%3E%3Cline x1='6' y1='6' x2='14' y2='14' stroke='%23e8a946' stroke-width='2'/%3E%3C/svg%3E") 10 10, pointer`;
      case "laser":
        return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Ccircle cx='8' cy='8' r='4' fill='%23ff4444' opacity='0.8'/%3E%3C/svg%3E") 8 8, pointer`;
      default:
        return "default";
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className="wb-canvas"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        cursor: getCursor(),
        touchAction: "none",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onWheel={onWheel}
    />
  );
}
