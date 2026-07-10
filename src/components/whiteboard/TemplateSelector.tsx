/* ── Template selector modal ──────────────────────────────────────── */

import type { WbElement, ShapeElement, TextElement } from "./types";
import { generateId } from "./types";

interface TemplateSelectorProps {
  onSelect: (elements: WbElement[]) => void;
  onClose: () => void;
}

interface Template {
  name: string;
  description: string;
  icon: string;
  generate: () => WbElement[];
}

const TEMPLATES: Template[] = [
  {
    name: "Blank",
    description: "Empty canvas",
    icon: "▢",
    generate: () => [],
  },
  {
    name: "Flowchart Grid",
    description: "Decision flow with connector lanes",
    icon: "⊞",
    generate: generateFlowchartGrid,
  },
  {
    name: "Memory / Variables",
    description: "Variable boxes for tracing values",
    icon: "⊟",
    generate: generateMemoryLayout,
  },
  {
    name: "Call Stack",
    description: "Vertical stack frames",
    icon: "☰",
    generate: generateCallStack,
  },
  {
    name: "List / Dict Grid",
    description: "Indexed cells for data structures",
    icon: "⊞",
    generate: generateListDictGrid,
  },
];

export function TemplateSelector({ onSelect, onClose }: TemplateSelectorProps) {
  return (
    <div className="wb-modal-overlay" onClick={onClose}>
      <div className="wb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wb-modal-header">
          <h3 className="wb-modal-title">Choose a Template</h3>
          <button className="wb-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="wb-template-grid">
          {TEMPLATES.map((t) => (
            <button
              key={t.name}
              className="wb-template-card"
              onClick={() => {
                onSelect(t.generate());
                onClose();
              }}
            >
              <span className="wb-template-icon">{t.icon}</span>
              <span className="wb-template-name">{t.name}</span>
              <span className="wb-template-desc">{t.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Template generators ─────────────────────────────────────────── */

function makeShape(
  x: number,
  y: number,
  w: number,
  h: number,
  kind: ShapeElement["shapeKind"],
  zIndex: number,
  opts?: Partial<ShapeElement>,
): ShapeElement {
  return {
    id: generateId(),
    type: "shape",
    shapeKind: kind,
    x,
    y,
    width: w,
    height: h,
    strokeColor: "oklch(0.7 0.02 240)",
    strokeWidth: 2,
    fillColor: null,
    zIndex,
    ...opts,
  };
}

function makeText(
  x: number,
  y: number,
  text: string,
  zIndex: number,
  opts?: Partial<TextElement>,
): TextElement {
  return {
    id: generateId(),
    type: "text",
    text,
    x,
    y,
    width: 200,
    fontSize: 14,
    color: "oklch(0.7 0.02 240)",
    zIndex,
    ...opts,
  };
}

function generateFlowchartGrid(): WbElement[] {
  const els: WbElement[] = [];
  let z = 0;

  // Start node
  els.push(makeShape(300, 50, 160, 50, "ellipse", z++, {
    strokeColor: "oklch(0.66 0.08 175)",
    fillColor: "rgba(100,180,170,0.1)",
  }));
  els.push(makeText(340, 65, "Start", z++, { color: "oklch(0.66 0.08 175)" }));

  // Arrow down
  els.push(makeShape(380, 100, 0, 60, "arrow", z++, { strokeColor: "oklch(0.7 0.02 240)" }));

  // Decision diamond
  els.push(makeShape(290, 160, 180, 100, "diamond", z++, {
    strokeColor: "oklch(0.76 0.14 75)",
    fillColor: "rgba(200,170,80,0.08)",
  }));
  els.push(makeText(340, 195, "Condition?", z++, { color: "oklch(0.76 0.14 75)" }));

  // Yes arrow
  els.push(makeShape(380, 260, 0, 60, "arrow", z++, { strokeColor: "oklch(0.66 0.08 175)" }));
  els.push(makeText(390, 280, "Yes", z++, { color: "oklch(0.66 0.08 175)", fontSize: 12 }));

  // Process box
  els.push(makeShape(300, 320, 160, 60, "rect", z++, {
    strokeColor: "oklch(0.7 0.02 240)",
    fillColor: "rgba(200,200,220,0.06)",
  }));
  els.push(makeText(330, 340, "Process", z++));

  // No arrow (right)
  els.push(makeShape(470, 210, 100, 0, "arrow", z++, { strokeColor: "oklch(0.72 0.17 25)" }));
  els.push(makeText(490, 195, "No", z++, { color: "oklch(0.72 0.17 25)", fontSize: 12 }));

  // Alt process
  els.push(makeShape(570, 185, 140, 50, "rect", z++, {
    strokeColor: "oklch(0.72 0.17 25)",
    fillColor: "rgba(200,100,80,0.08)",
  }));
  els.push(makeText(595, 200, "Alt path", z++, { color: "oklch(0.72 0.17 25)" }));

  // End
  els.push(makeShape(300, 420, 160, 50, "ellipse", z++, {
    strokeColor: "oklch(0.66 0.08 175)",
    fillColor: "rgba(100,180,170,0.1)",
  }));
  els.push(makeText(350, 435, "End", z++, { color: "oklch(0.66 0.08 175)" }));

  return els;
}

function generateMemoryLayout(): WbElement[] {
  const els: WbElement[] = [];
  let z = 0;
  const vars = ["x", "y", "name", "total", "items"];

  els.push(makeText(80, 40, "Memory / Variables", z++, {
    fontSize: 20,
    color: "oklch(0.76 0.14 75)",
    width: 300,
  }));

  for (let i = 0; i < vars.length; i++) {
    const y = 90 + i * 60;
    // Label
    els.push(makeText(80, y + 12, vars[i], z++, {
      color: "oklch(0.66 0.08 175)",
      fontSize: 14,
    }));
    // Box
    els.push(makeShape(180, y, 200, 44, "rect", z++, {
      strokeColor: "oklch(0.7 0.02 240)",
      fillColor: "rgba(200,200,220,0.04)",
    }));
    // Value placeholder
    els.push(makeText(195, y + 12, "???", z++, {
      color: "oklch(0.5 0.02 240)",
      fontSize: 14,
    }));
  }

  return els;
}

function generateCallStack(): WbElement[] {
  const els: WbElement[] = [];
  let z = 0;
  const frames = ["main()", "calculate(x, y)", "add(a, b)"];

  els.push(makeText(120, 40, "Call Stack", z++, {
    fontSize: 20,
    color: "oklch(0.76 0.14 75)",
    width: 250,
  }));

  for (let i = 0; i < frames.length; i++) {
    const y = 90 + i * 70;
    els.push(makeShape(100, y, 260, 55, "rect", z++, {
      strokeColor: i === frames.length - 1 ? "oklch(0.76 0.14 75)" : "oklch(0.4 0.02 240)",
      fillColor: i === frames.length - 1 ? "rgba(200,170,80,0.1)" : "rgba(200,200,220,0.03)",
    }));
    els.push(makeText(120, y + 16, frames[i], z++, {
      color: i === frames.length - 1 ? "oklch(0.76 0.14 75)" : "oklch(0.6 0.02 240)",
      fontSize: 14,
    }));
    if (i < frames.length - 1) {
      els.push(makeShape(230, y + 55, 0, 15, "arrow", z++, {
        strokeColor: "oklch(0.4 0.02 240)",
      }));
    }
  }

  // Stack label
  els.push(makeText(370, 90, "← top", z++, {
    color: "oklch(0.5 0.02 240)",
    fontSize: 12,
  }));
  els.push(makeText(370, 230, "← bottom", z++, {
    color: "oklch(0.5 0.02 240)",
    fontSize: 12,
  }));

  return els;
}

function generateListDictGrid(): WbElement[] {
  const els: WbElement[] = [];
  let z = 0;

  // List section
  els.push(makeText(80, 40, "my_list = [...]", z++, {
    fontSize: 18,
    color: "oklch(0.76 0.14 75)",
    width: 300,
  }));

  for (let i = 0; i < 6; i++) {
    const x = 80 + i * 80;
    els.push(makeShape(x, 80, 70, 50, "rect", z++, {
      strokeColor: "oklch(0.4 0.02 240)",
      fillColor: "rgba(200,200,220,0.04)",
    }));
    els.push(makeText(x + 25, 60, `[${i}]`, z++, {
      color: "oklch(0.5 0.02 240)",
      fontSize: 11,
    }));
  }

  // Dict section
  els.push(makeText(80, 180, 'my_dict = {...}', z++, {
    fontSize: 18,
    color: "oklch(0.66 0.08 175)",
    width: 300,
  }));

  const keys = ["name", "age", "score"];
  for (let i = 0; i < keys.length; i++) {
    const y = 220 + i * 55;
    // Key box
    els.push(makeShape(80, y, 120, 44, "rect", z++, {
      strokeColor: "oklch(0.66 0.08 175)",
      fillColor: "rgba(100,180,170,0.08)",
    }));
    els.push(makeText(95, y + 12, `"${keys[i]}"`, z++, {
      color: "oklch(0.66 0.08 175)",
      fontSize: 13,
    }));
    // Arrow
    els.push(makeShape(200, y + 22, 30, 0, "arrow", z++, {
      strokeColor: "oklch(0.5 0.02 240)",
    }));
    // Value box
    els.push(makeShape(230, y, 140, 44, "rect", z++, {
      strokeColor: "oklch(0.4 0.02 240)",
      fillColor: "rgba(200,200,220,0.04)",
    }));
  }

  return els;
}
