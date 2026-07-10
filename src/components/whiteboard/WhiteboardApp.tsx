/* ── WhiteboardApp — top-level orchestrator ───────────────────────── */

import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "@tanstack/react-router";
import type {
  WbElement,
  Tool,
  ViewTransform,
  BackgroundKind,
  LaserTrail,
  Board,
  TextElement,
  CodeSnippet as CodeSnippetType,
  StickyNote as StickyNoteType,
  SnapGuide,
} from "./types";
import { generateId, TOOL_SHORTCUTS } from "./types";
import { HistoryManager } from "./history";
import { saveBoard, loadBoard, listBoards, deleteBoard, renameBoard } from "./storage";
import { exportPNG, exportSVG } from "./exporters";
import { Canvas } from "./Canvas";
import { Toolbar } from "./Toolbar";
import { BoardSidebar } from "./BoardSidebar";
import { ZoomIndicator } from "./ZoomIndicator";
import { TemplateSelector } from "./TemplateSelector";
import { CodeSnippetPicker } from "./CodeSnippetPicker";
import { ContextMenu } from "./ContextMenu";

function createNewBoard(name?: string): Board {
  return {
    id: generateId(),
    name: name || `Board ${new Date().toLocaleTimeString()}`,
    elements: [],
    background: "dots",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function WhiteboardApp() {
  /* ── Board state ──────────────────────────────────── */
  const [boards, setBoards] = useState<Board[]>(() => {
    const saved = listBoards();
    return saved.length > 0 ? saved : [createNewBoard("Untitled Board")];
  });
  const [activeBoardId, setActiveBoardId] = useState<string>(boards[0].id);

  /* ── Element state ────────────────────────────────── */
  const [elements, _setElements] = useState<WbElement[]>(() => {
    const b = boards.find((b) => b.id === activeBoardId);
    return b?.elements ?? [];
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  /* ── Tool state ───────────────────────────────────── */
  const [tool, setTool] = useState<Tool>("pen");
  const [penColor, setPenColor] = useState("oklch(0.76 0.14 75)");
  const [penThickness, setPenThickness] = useState(6);
  const [shapeStrokeColor, setShapeStrokeColor] = useState("oklch(0.76 0.14 75)");
  const [shapeStrokeWidth, setShapeStrokeWidth] = useState(2);
  const [shapeFillColor, setShapeFillColor] = useState<string | null>(null);

  /* ── View state ───────────────────────────────────── */
  const [view, setView] = useState<ViewTransform>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });
  const [background, setBackground] = useState<BackgroundKind>("dots");

  /* ── UI state ─────────────────────────────────────── */
  const [presentMode, setPresentMode] = useState(false);
  const [presentUIVisible, setPresentUIVisible] = useState(false);
  const presentTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showBoards, setShowBoards] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);
  const [laserTrails, setLaserTrails] = useState<LaserTrail[]>([]);
  const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [textInput, setTextInput] = useState<{ x: number; y: number; value: string } | null>(null);

  /* ── History ──────────────────────────────────────── */
  const historyRef = useRef(new HistoryManager());
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const pushHistory = useCallback(() => {
    historyRef.current.push(elements);
    setCanUndo(historyRef.current.canUndo);
    setCanRedo(historyRef.current.canRedo);
  }, [elements]);

  const setElements = useCallback(
    (fn: (prev: WbElement[]) => WbElement[]) => {
      _setElements((prev) => fn(prev));
    },
    [],
  );

  const undo = useCallback(() => {
    const prev = historyRef.current.undo(elements);
    if (prev) {
      _setElements(prev);
      setSelectedIds(new Set());
    }
    setCanUndo(historyRef.current.canUndo);
    setCanRedo(historyRef.current.canRedo);
  }, [elements]);

  const redo = useCallback(() => {
    const next = historyRef.current.redo(elements);
    if (next) {
      _setElements(next);
      setSelectedIds(new Set());
    }
    setCanUndo(historyRef.current.canUndo);
    setCanRedo(historyRef.current.canRedo);
  }, [elements]);

  /* ── Autosave ──────────────────────────── */
  useEffect(() => {
    const board = boards.find((b) => b.id === activeBoardId);
    if (board) {
      saveBoard({ ...board, elements, background });
    }
  }, [elements, background, activeBoardId, boards]);

  /* ── Board switching ──────────────────────────────── */
  const switchBoard = useCallback(
    (id: string) => {
      // Save current board first
      const current = boards.find((b) => b.id === activeBoardId);
      if (current) {
        saveBoard({ ...current, elements, background });
      }

      // Load new board
      const loaded = loadBoard(id);
      if (loaded) {
        _setElements(loaded.elements);
        setBackground(loaded.background);
        setActiveBoardId(id);
        setSelectedIds(new Set());
        historyRef.current.clear();
        setCanUndo(false);
        setCanRedo(false);
        setView({ offsetX: 0, offsetY: 0, scale: 1 });
      }
    },
    [activeBoardId, boards, elements, background],
  );

  const addNewBoard = useCallback(() => {
    const nb = createNewBoard();
    setBoards((prev) => {
      const updated = [...prev, nb];
      saveBoard(nb);
      return updated;
    });
    switchBoard(nb.id);
    setActiveBoardId(nb.id);
    _setElements([]);
    historyRef.current.clear();
  }, [switchBoard]);

  const handleDeleteBoard = useCallback(
    (id: string) => {
      if (boards.length <= 1) return;
      deleteBoard(id);
      setBoards((prev) => prev.filter((b) => b.id !== id));
      if (id === activeBoardId) {
        const remaining = boards.filter((b) => b.id !== id);
        if (remaining.length > 0) {
          switchBoard(remaining[0].id);
        }
      }
    },
    [boards, activeBoardId, switchBoard],
  );

  const handleRenameBoard = useCallback(
    (id: string, name: string) => {
      renameBoard(id, name);
      setBoards((prev) =>
        prev.map((b) => (b.id === id ? { ...b, name, updatedAt: Date.now() } : b)),
      );
    },
    [],
  );

  /* ── Laser trail cleanup ──────────────────────────── */
  useEffect(() => {
    if (laserTrails.length === 0) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setLaserTrails((prev) => prev.filter((t) => now - t.timestamp < 1500));
    }, 100);
    return () => clearInterval(interval);
  }, [laserTrails.length]);

  /* ── Text creation ────────────────────────────────── */
  const handleTextCreate = useCallback(
    (x: number, y: number) => {
      setTextInput({ x, y, value: "" });
    },
    [],
  );

  const commitText = useCallback(() => {
    if (textInput && textInput.value.trim()) {
      pushHistory();
      const newText: TextElement = {
        id: generateId(),
        type: "text",
        text: textInput.value,
        x: textInput.x,
        y: textInput.y,
        width: 300,
        fontSize: 24,
        color: penColor,
        zIndex: elements.length,
      };
      setElements((prev) => [...prev, newText]);
    }
    setTextInput(null);
  }, [textInput, pushHistory, setElements, penColor, elements.length]);

  /* ── Code snippet creation ────────────────────────── */
  const handleCodeCreate = useCallback(
    (x: number, y: number) => {
      // Open the snippet picker, which will call insertCodeSnippet
      setShowSnippets(true);
      // Store the click position for when the snippet is selected
      codeInsertPosRef.current = { x, y };
    },
    [],
  );

  const codeInsertPosRef = useRef<{ x: number; y: number }>({ x: 100, y: 100 });

  const insertCodeSnippet = useCallback(
    (code: string, _label: string) => {
      pushHistory();
      const pos = codeInsertPosRef.current;
      const lines = code.split("\n").length;
      const newSnippet: CodeSnippetType = {
        id: generateId(),
        type: "code",
        code,
        x: pos.x,
        y: pos.y,
        width: 400,
        height: Math.max(120, 36 + lines * 18 + 16),
        zIndex: elements.length,
      };
      setElements((prev) => [...prev, newSnippet]);
    },
    [pushHistory, setElements, elements.length],
  );

  /* ── Sticky note creation ─────────────────────────── */
  const handleStickyCreate = useCallback(
    (x: number, y: number) => {
      pushHistory();
      const newSticky: StickyNoteType = {
        id: generateId(),
        type: "sticky",
        text: "Note...",
        x,
        y,
        width: 180,
        height: 120,
        color: "oklch(0.94 0.03 85)",
        zIndex: elements.length,
      };
      setElements((prev) => [...prev, newSticky]);
    },
    [pushHistory, setElements, elements.length],
  );

  /* ── Layer operations ─────────────────────────────── */
  const bringToFront = useCallback(() => {
    if (selectedIds.size === 0) return;
    pushHistory();
    const maxZ = Math.max(...elements.map((e) => e.zIndex));
    setElements((prev) =>
      prev.map((el) =>
        selectedIds.has(el.id) ? { ...el, zIndex: maxZ + 1 } : el,
      ),
    );
  }, [selectedIds, elements, pushHistory, setElements]);

  const sendToBack = useCallback(() => {
    if (selectedIds.size === 0) return;
    pushHistory();
    const minZ = Math.min(...elements.map((e) => e.zIndex));
    setElements((prev) =>
      prev.map((el) =>
        selectedIds.has(el.id) ? { ...el, zIndex: minZ - 1 } : el,
      ),
    );
  }, [selectedIds, elements, pushHistory, setElements]);

  const groupSelected = useCallback(() => {
    if (selectedIds.size < 2) return;
    pushHistory();
    const gid = generateId();
    setElements((prev) =>
      prev.map((el) =>
        selectedIds.has(el.id) ? { ...el, groupId: gid } : el,
      ),
    );
  }, [selectedIds, pushHistory, setElements]);

  const ungroupSelected = useCallback(() => {
    pushHistory();
    setElements((prev) =>
      prev.map((el) =>
        selectedIds.has(el.id) ? { ...el, groupId: undefined } : el,
      ),
    );
  }, [selectedIds, pushHistory, setElements]);

  const duplicateSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    pushHistory();
    const newEls: WbElement[] = [];
    for (const el of elements) {
      if (selectedIds.has(el.id)) {
        const clone = structuredClone(el);
        clone.id = generateId();
        if ("x" in clone) (clone as any).x += 20;
        if ("y" in clone) (clone as any).y += 20;
        if (clone.type === "freehand") {
          clone.points = clone.points.map((p) => ({
            ...p,
            x: p.x + 20,
            y: p.y + 20,
          }));
        }
        newEls.push(clone);
      }
    }
    setElements((prev) => [...prev, ...newEls]);
    setSelectedIds(new Set(newEls.map((e) => e.id)));
  }, [selectedIds, elements, pushHistory, setElements]);

  const deleteSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    pushHistory();
    setElements((prev) => prev.filter((el) => !selectedIds.has(el.id)));
    setSelectedIds(new Set());
  }, [selectedIds, pushHistory, setElements]);

  const clearAll = useCallback(() => {
    if (elements.length === 0) return;
    pushHistory();
    setElements(() => []);
    setSelectedIds(new Set());
  }, [elements.length, pushHistory, setElements]);

  /* ── Template loading ─────────────────────────────── */
  const loadTemplate = useCallback(
    (templateElements: WbElement[]) => {
      pushHistory();
      setElements((prev) => [...prev, ...templateElements]);
    },
    [pushHistory, setElements],
  );

  /* ── Keyboard shortcuts ───────────────────────────── */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        redo();
        return;
      }

      // Delete
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIds.size > 0) {
          e.preventDefault();
          deleteSelected();
          return;
        }
      }

      // Escape — deselect or exit present mode
      if (e.key === "Escape") {
        if (presentMode) {
          setPresentMode(false);
        } else {
          setSelectedIds(new Set());
          setContextMenu(null);
        }
        return;
      }

      // Tool shortcuts (only when no modifier)
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const t = TOOL_SHORTCUTS[e.key.toLowerCase()];
        if (t) {
          setTool(t);
          return;
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo, deleteSelected, selectedIds, presentMode]);

  /* ── Present Mode UI Fade ─────────────────────────── */
  useEffect(() => {
    if (!presentMode) return;
    const onMouseMove = () => {
      setPresentUIVisible(true);
      if (presentTimerRef.current) clearTimeout(presentTimerRef.current);
      presentTimerRef.current = setTimeout(() => {
        setPresentUIVisible(false);
      }, 2000);
    };
    window.addEventListener("mousemove", onMouseMove);
    // trigger once on mount
    onMouseMove();
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      if (presentTimerRef.current) clearTimeout(presentTimerRef.current);
    };
  }, [presentMode]);

  /* ── Context menu ─────────────────────────────────── */
  const onContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (selectedIds.size > 0) {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY });
      }
    },
    [selectedIds],
  );

  /* ── Zoom controls ────────────────────────────────── */
  const zoomIn = useCallback(() => {
    setView((v) => ({ ...v, scale: Math.min(5, v.scale * 1.15) }));
  }, []);
  const zoomOut = useCallback(() => {
    setView((v) => ({ ...v, scale: Math.max(0.1, v.scale / 1.15) }));
  }, []);
  const zoomReset = useCallback(() => {
    setView({ offsetX: 0, offsetY: 0, scale: 1 });
  }, []);

  const hasGroupInSelection = elements.some(
    (el) => selectedIds.has(el.id) && el.groupId,
  );

  return (
    <div
      ref={containerRef}
      className="wb-container"
      onContextMenu={onContextMenu}
    >
      {/* Back button */}
      {!presentMode && (
        <Link to="/" className="wb-back-btn" title="Back to pycourse">
          <span className="wb-back-arrow">←</span>
          <span className="wb-back-text">pycourse</span>
        </Link>
      )}

      {/* Active board name */}
      {!presentMode && (
        <div className="wb-board-name">
          {boards.find((b) => b.id === activeBoardId)?.name || "Untitled"}
        </div>
      )}

      {/* Canvas */}
      <Canvas
        elements={elements}
        setElements={setElements}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        tool={tool}
        view={view}
        setView={setView}
        background={background}
        penColor={penColor}
        penThickness={penThickness}
        shapeStrokeColor={shapeStrokeColor}
        shapeStrokeWidth={shapeStrokeWidth}
        shapeFillColor={shapeFillColor}
        laserTrails={laserTrails}
        setLaserTrails={setLaserTrails}
        snapGuides={snapGuides}
        setSnapGuides={setSnapGuides}
        pushHistory={pushHistory}
        presentMode={presentMode}
        onTextCreate={handleTextCreate}
        onCodeCreate={handleCodeCreate}
        onStickyCreate={handleStickyCreate}
        containerRef={containerRef}
      />

      {/* Toolbar */}
      <Toolbar
        tool={tool}
        setTool={setTool}
        penColor={penColor}
        setPenColor={setPenColor}
        penThickness={penThickness}
        setPenThickness={setPenThickness}
        shapeStrokeColor={shapeStrokeColor}
        setShapeStrokeColor={setShapeStrokeColor}
        shapeStrokeWidth={shapeStrokeWidth}
        setShapeStrokeWidth={setShapeStrokeWidth}
        shapeFillColor={shapeFillColor}
        setShapeFillColor={setShapeFillColor}
        background={background}
        setBackground={setBackground}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onExportPNG={(scale, bg) => exportPNG(elements, { scale, background: bg })}
        onExportSVG={() => exportSVG(elements)}
        onClearAll={clearAll}
        onTogglePresent={() => setPresentMode((p) => !p)}
        onOpenTemplates={() => setShowTemplates(true)}
        onOpenSnippets={() => {
          codeInsertPosRef.current = {
            x: (-view.offsetX + window.innerWidth / 2) / view.scale - 200,
            y: (-view.offsetY + window.innerHeight / 2) / view.scale - 100,
          };
          setShowSnippets(true);
        }}
        onOpenBoards={() => setShowBoards((s) => !s)}
        presentMode={presentMode}
      />

      {/* Zoom */}
      <ZoomIndicator
        scale={view.scale}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={zoomReset}
        presentMode={presentMode}
      />

      {/* Board sidebar */}
      {showBoards && (
        <BoardSidebar
          boards={boards}
          activeBoardId={activeBoardId}
          onSwitch={(id) => {
            switchBoard(id);
            setShowBoards(false);
          }}
          onNew={addNewBoard}
          onDelete={handleDeleteBoard}
          onRename={handleRenameBoard}
          onClose={() => setShowBoards(false)}
        />
      )}

      {/* Template selector */}
      {showTemplates && (
        <TemplateSelector
          onSelect={loadTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {/* Code snippet picker */}
      {showSnippets && (
        <CodeSnippetPicker
          onSelect={insertCodeSnippet}
          onClose={() => setShowSnippets(false)}
        />
      )}

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onBringToFront={bringToFront}
          onSendToBack={sendToBack}
          onGroup={groupSelected}
          onUngroup={ungroupSelected}
          onDuplicate={duplicateSelected}
          onDelete={deleteSelected}
          hasSelection={selectedIds.size > 0}
          hasGroup={hasGroupInSelection}
        />
      )}

      {/* Inline text input */}
      {textInput && (
        <div
          className="wb-text-input-overlay"
          style={{
            left: textInput.x * view.scale + view.offsetX,
            top: textInput.y * view.scale + view.offsetY,
          }}
        >
          <textarea
            className="wb-text-input"
            value={textInput.value}
            onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
            onBlur={commitText}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                commitText();
              }
              if (e.key === "Escape") {
                setTextInput(null);
              }
            }}
            autoFocus
            placeholder="Type here..."
          />
        </div>
      )}

      {/* Present mode exit button */}
      {presentMode && (
        <button
          className={`wb-present-exit ${presentUIVisible ? "visible" : ""}`}
          onClick={() => setPresentMode(false)}
        >
          Exit Present Mode (Esc)
        </button>
      )}
    </div>
  );
}
