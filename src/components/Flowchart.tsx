import { useState } from "react";

type Node = {
  id: string;
  label: string;
  x: number;
  y: number;
  type?: "rect" | "diamond";
  editable?: boolean;
};

type Edge = {
  from: string;
  to: string;
  label?: string;
  path?: string; // custom SVG path data if right-angled lines are complex
};

export type FlowchartProps = {
  kind: "module3" | "module4" | "module6" | "module10";
  activeNodeId?: string | null;
  visitedNodeIds?: string[];
  onNodeClick?: (id: string) => void;
};

const layouts: Record<string, { nodes: Node[]; edges: Edge[] }> = {
  module3: { // Control Flow (While Loop)
    nodes: [
      { id: "start", label: "Enter Loop", x: 150, y: 20 },
      { id: "condition", label: "Condition?", x: 150, y: 100, type: "diamond" },
      { id: "body", label: "Loop Body", x: 150, y: 220 },
      { id: "end", label: "Exit", x: 300, y: 100 }
    ],
    edges: [
      { from: "start", to: "condition" },
      { from: "condition", to: "body", label: "True", path: "M 150 150 L 150 200" },
      { from: "condition", to: "end", label: "False", path: "M 200 100 L 270 100" },
      { from: "body", to: "condition", path: "M 100 220 L 50 220 L 50 100 L 100 100" } // Back loop
    ]
  },
  module4: { // Functions
    nodes: [
      { id: "call", label: "Caller", x: 100, y: 20 },
      { id: "def", label: "Function()", x: 250, y: 20 },
      { id: "body", label: "Execute", x: 250, y: 100 },
      { id: "ret", label: "Return", x: 250, y: 180 },
      { id: "resume", label: "Resume Caller", x: 100, y: 180 }
    ],
    edges: [
      { from: "call", to: "def", label: "args" },
      { from: "def", to: "body" },
      { from: "body", to: "ret" },
      { from: "ret", to: "resume", label: "value" }
    ]
  },
  module6: { // Exception Handling
    nodes: [
      { id: "try", label: "try block", x: 150, y: 20 },
      { id: "except", label: "except block", x: 50, y: 120 },
      { id: "else", label: "else block", x: 250, y: 120 },
      { id: "finally", label: "finally block", x: 150, y: 220 }
    ],
    edges: [
      { from: "try", to: "except", label: "Error", path: "M 120 40 L 50 40 L 50 100" },
      { from: "try", to: "else", label: "Success", path: "M 180 40 L 250 40 L 250 100" },
      { from: "except", to: "finally", path: "M 50 140 L 50 220 L 120 220" },
      { from: "else", to: "finally", path: "M 250 140 L 250 220 L 180 220" }
    ]
  },
  module10: { // Planning (Editable)
    nodes: [
      { id: "step1", label: "1. Define Data", x: 150, y: 20, editable: true },
      { id: "step2", label: "2. Write Functions", x: 150, y: 100, editable: true },
      { id: "step3", label: "3. Main Loop", x: 150, y: 180, editable: true },
      { id: "step4", label: "4. Test App", x: 150, y: 260, editable: true }
    ],
    edges: [
      { from: "step1", to: "step2" },
      { from: "step2", to: "step3" },
      { from: "step3", to: "step4" }
    ]
  }
};

export function Flowchart({ kind, activeNodeId, visitedNodeIds = [], onNodeClick }: FlowchartProps) {
  const layout = layouts[kind];
  const [editedLabels, setEditedLabels] = useState<Record<string, string>>({});
  const [editingNode, setEditingNode] = useState<string | null>(null);

  if (!layout) return null;

  return (
    <div className="relative w-full max-w-[400px] h-[320px] bg-warm-black border border-white/10 rounded-md overflow-hidden font-mono mx-auto">
      <svg width="100%" height="100%" viewBox="0 0 400 320">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#3B82F6" className="fill-teal/50" />
          </marker>
        </defs>

        {/* Edges */}
        {layout.edges.map((e, i) => {
          let d = e.path;
          if (!d) {
            const fromNode = layout.nodes.find(n => n.id === e.from);
            const toNode = layout.nodes.find(n => n.id === e.to);
            if (fromNode && toNode) {
              const startY = fromNode.y + (fromNode.type === "diamond" ? 50 : 40);
              d = `M ${fromNode.x} ${startY} L ${toNode.x} ${toNode.y}`;
            }
          }
          return (
            <g key={i}>
              {d && <path d={d} fill="none" stroke="currentColor" className="text-teal/30" strokeWidth="2" markerEnd="url(#arrow)" />}
              {e.label && d && (
                <text 
                  // Naive midpoint for label
                  x={(parseFloat(d.split(" ")[1]) + parseFloat(d.split(" ").slice(-2)[0])) / 2 + 5} 
                  y={(parseFloat(d.split(" ")[2]) + parseFloat(d.split(" ").slice(-1)[0])) / 2 - 5}
                  fill="currentColor" className="text-teal/70 text-[10px]"
                >
                  {e.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {layout.nodes.map(n => {
          const isActive = activeNodeId === n.id;
          const isVisited = visitedNodeIds.includes(n.id);
          const width = 100;
          const height = n.type === "diamond" ? 100 : 40;
          
          let boxClasses = "transition-all duration-300 ";
          let textClasses = "text-xs font-semibold text-center select-none ";

          if (isActive) {
            boxClasses += "fill-[#0B1528] stroke-amber stroke-[2px] filter drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] cursor-pointer";
            textClasses += "fill-amber";
          } else if (isVisited) {
            boxClasses += "fill-transparent stroke-teal/40 stroke-[1px] cursor-pointer";
            textClasses += "fill-teal/60";
          } else {
            boxClasses += "fill-[#0B1528] stroke-amber/40 stroke-[1px] cursor-pointer hover:stroke-amber/70";
            textClasses += "fill-foreground/80";
          }

          const label = editedLabels[n.id] ?? n.label;

          return (
            <g 
              key={n.id} 
              onClick={() => {
                if (n.editable) setEditingNode(n.id);
                else if (onNodeClick) onNodeClick(n.id);
              }}
              style={{ transform: `translate(${n.x - width/2}px, ${n.y}px)` }}
            >
              {n.type === "diamond" ? (
                <polygon points={`${width/2},0 ${width},${height/2} ${width/2},${height} 0,${height/2}`} className={boxClasses} />
              ) : (
                <rect width={width} height={height} rx="0" className={boxClasses} />
              )}
              
              {!editingNode || editingNode !== n.id ? (
                <text 
                  x={width/2} 
                  y={n.type === "diamond" ? height/2 + 4 : height/2 + 4} 
                  textAnchor="middle" 
                  className={textClasses}
                >
                  {label}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      {/* HTML Input Overlay for editing */}
      {editingNode && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-warm-black border border-amber p-4 rounded shadow-xl flex flex-col gap-2">
            <label className="text-xs text-amber font-mono">Edit Plan Node:</label>
            <input 
              autoFocus
              type="text" 
              value={editedLabels[editingNode] ?? layout.nodes.find(n => n.id === editingNode)?.label ?? ""}
              onChange={e => setEditedLabels(prev => ({ ...prev, [editingNode]: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && setEditingNode(null)}
              className="bg-transparent border-b border-teal text-white outline-none font-mono text-sm px-1 py-1"
            />
            <button onClick={() => setEditingNode(null)} className="text-xs bg-secondary text-white px-2 py-1 rounded mt-2 hover:bg-amber hover:text-black">
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
