// Custom SVG icons for the 12 module cards on the landing page.
// Line-art style, 28×28 rendered from a 24×24 viewBox.
// Accepts `hovering` to trigger topic-specific CSS animations.

interface IconProps {
  hovering?: boolean;
  className?: string;
}

const base = {
  width: 28,
  height: 28,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

// ── Module 1 · Introduction / Terminal ─────────────────────────────────────
// Monitor screen with a blinking cursor line
function Icon01({ hovering }: IconProps) {
  return (
    <svg {...base}>
      <rect x="2" y="3" width="20" height="15" rx="2" />
      <polyline points="6,10 9,13 6,16" />
      <line
        x1="11"
        y1="16"
        x2="19"
        y2="16"
        style={
          hovering
            ? { animation: "char-blink 0.5s steps(2, start) infinite" }
            : undefined
        }
      />
      <line x1="8" y1="20" x2="16" y2="20" strokeOpacity={0.4} />
    </svg>
  );
}

// ── Module 2 · Variables & Types ────────────────────────────────────────────
// x = value — two boxes connected by equals sign
function Icon02({ hovering }: IconProps) {
  return (
    <svg {...base}>
      <rect x="2" y="7" width="7" height="10" rx="1" />
      <line x1="10.5" y1="11" x2="13.5" y2="11" />
      <line x1="10.5" y1="13" x2="13.5" y2="13" />
      <rect
        x="15"
        y="7"
        width="7"
        height="10"
        rx="1"
        style={
          hovering
            ? {
                animation: "icon-pulse-scale 0.35s ease-out forwards",
                transformOrigin: "18.5px 12px",
              }
            : undefined
        }
      />
    </svg>
  );
}

// ── Module 3 · Control Flow (loops & conditionals) ──────────────────────────
// Circular refresh arrows — the loop spins on hover
function Icon03({ hovering }: IconProps) {
  return (
    <svg
      {...base}
      style={
        hovering
          ? {
              animation: "icon-spin-once 0.55s ease-out forwards",
              transformOrigin: "12px 12px",
            }
          : undefined
      }
    >
      <path d="M4 12a8 8 0 0 1 13.66-5.66" />
      <polyline points="21,3 17.34,6.34 14,4" />
      <path d="M20 12a8 8 0 0 1-13.66 5.66" />
      <polyline points="3,21 6.66,17.66 10,20" />
    </svg>
  );
}

// ── Module 4 · Functions ────────────────────────────────────────────────────
// Box labeled f(x) with in/out arrows — arrows shoot through on hover
function Icon04({ hovering }: IconProps) {
  const arrowStyle = hovering
    ? { animation: "icon-slide-right 0.4s ease-out" }
    : undefined;
  return (
    <svg {...base}>
      <rect x="7" y="5" width="10" height="14" rx="1" />
      {/* f(x) suggestion — horizontal bar + vertical stem */}
      <path d="M11 9 q0-2 2-2 t2 2 v6" />
      <line x1="9" y1="11" x2="15" y2="11" />
      {/* In arrow */}
      <line x1="1" y1="12" x2="7" y2="12" style={arrowStyle} />
      <polyline points="4,10 2,12 4,14" style={arrowStyle} />
      {/* Out arrow */}
      <line x1="17" y1="12" x2="23" y2="12" style={arrowStyle} />
      <polyline points="20,10 22,12 20,14" style={arrowStyle} />
    </svg>
  );
}

// ── Module 5 · Data Structures ──────────────────────────────────────────────
// [ • • • ] — brackets expand on hover
function Icon05({ hovering }: IconProps) {
  const lStyle = hovering
    ? {
        animation: "icon-expand-left 0.3s ease-out forwards",
        transformOrigin: "4px 12px",
      }
    : undefined;
  const rStyle = hovering
    ? {
        animation: "icon-expand-right 0.3s ease-out forwards",
        transformOrigin: "20px 12px",
      }
    : undefined;
  return (
    <svg {...base}>
      {/* Left bracket */}
      <line x1="4" y1="4" x2="4" y2="20" style={lStyle} />
      <line x1="4" y1="4" x2="7" y2="4" style={lStyle} />
      <line x1="4" y1="20" x2="7" y2="20" style={lStyle} />
      {/* Right bracket */}
      <line x1="20" y1="4" x2="20" y2="20" style={rStyle} />
      <line x1="17" y1="4" x2="20" y2="4" style={rStyle} />
      <line x1="17" y1="20" x2="20" y2="20" style={rStyle} />
      {/* Items */}
      <circle cx="12" cy="9" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ── Module 6 · Error Handling ───────────────────────────────────────────────
// Shield with ! — shield shakes briefly on hover (blocking a hit)
function Icon06({ hovering }: IconProps) {
  return (
    <svg
      {...base}
      style={
        hovering
          ? { animation: "icon-shake 0.3s ease-out" }
          : undefined
      }
    >
      <path d="M12 3 L20 7 V13 Q20 20 12 22 Q4 20 4 13 V7 Z" />
      <line x1="12" y1="10" x2="12" y2="15" />
      <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ── Module 7 · File I/O ─────────────────────────────────────────────────────
// Document with read/write arrows — arrows animate on hover
function Icon07({ hovering }: IconProps) {
  const arrowStyle = hovering
    ? { animation: "icon-bounce-up 0.35s ease-out infinite alternate" }
    : undefined;
  return (
    <svg {...base}>
      <path d="M4 2 h10 l4 4 v16 H4 Z" />
      <polyline points="14,2 14,6 18,6" />
      {/* Right side arrows */}
      <line x1="18" y1="11" x2="22" y2="11" />
      <polyline points="20,9 22,11 20,13" style={arrowStyle} />
      <line x1="18" y1="15" x2="22" y2="15" />
      <polyline points="20,13 22,15 20,17" style={arrowStyle} />
    </svg>
  );
}

// ── Module 8 · Modules & Imports ────────────────────────────────────────────
// Two interlocking blocks — second block slides in on hover
function Icon08({ hovering }: IconProps) {
  return (
    <svg {...base}>
      <rect x="1" y="1" width="10" height="10" rx="1" />
      <rect
        x="13"
        y="13"
        width="10"
        height="10"
        rx="1"
        style={
          hovering
            ? {
                animation: "icon-slide-right 0.35s ease-out",
              }
            : undefined
        }
      />
      <polyline points="11,6 15,6 15,13" strokeOpacity={0.5} />
    </svg>
  );
}

// ── Module 9 · OOP / Classes ────────────────────────────────────────────────
// Class hierarchy diamond — child nodes drop in on hover
function Icon09({ hovering }: IconProps) {
  const childStyle = hovering
    ? { animation: "icon-bounce-up 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards" }
    : undefined;
  return (
    <svg {...base}>
      {/* Parent class */}
      <circle cx="12" cy="5" r="3.5" />
      {/* Hierarchy lines */}
      <line x1="12" y1="8.5" x2="12" y2="13" />
      <line x1="12" y1="13" x2="6" y2="15" />
      <line x1="12" y1="13" x2="18" y2="15" />
      {/* Child classes */}
      <circle cx="6" cy="18" r="3" style={childStyle} />
      <circle cx="18" cy="18" r="3" style={childStyle} />
    </svg>
  );
}

// ── Module 10 · Mini Project ────────────────────────────────────────────────
// Stacked building blocks — top block drops in on hover
function Icon10({ hovering }: IconProps) {
  return (
    <svg {...base}>
      <rect x="3" y="16" width="18" height="5" rx="1" />
      <rect x="4" y="10" width="16" height="6" rx="1" />
      <rect
        x="7"
        y="4"
        width="10"
        height="6"
        rx="1"
        style={
          hovering
            ? {
                animation: "icon-bounce-up 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
              }
            : undefined
        }
      />
    </svg>
  );
}

// ── Module 11 · Debugging ───────────────────────────────────────────────────
// Magnifying glass — pans across code lines on hover
function Icon11({ hovering }: IconProps) {
  const lensStyle = hovering
    ? { animation: "icon-pan 0.5s ease-in-out" }
    : undefined;
  return (
    <svg {...base}>
      {/* Code lines */}
      <line x1="2" y1="8" x2="14" y2="8" strokeOpacity={0.4} />
      <line x1="2" y1="12" x2="12" y2="12" strokeOpacity={0.4} />
      <line x1="2" y1="16" x2="14" y2="16" strokeOpacity={0.4} />
      {/* Magnifier */}
      <circle cx="15" cy="9" r="5" style={lensStyle} />
      <line
        x1="18.5"
        y1="13"
        x2="22"
        y2="16.5"
        strokeWidth={1.8}
        style={lensStyle}
      />
    </svg>
  );
}

// ── Module 12 · Next Steps ──────────────────────────────────────────────────
// Rocket — lifts off on hover
function Icon12({ hovering }: IconProps) {
  return (
    <svg
      {...base}
      style={
        hovering
          ? {
              animation: "icon-bounce-up 0.4s ease-out",
            }
          : undefined
      }
    >
      <path d="M12 2 C12 2 8 7 8 13 L8 17 L12 15 L16 17 L16 13 C16 7 12 2 12 2 Z" />
      <circle cx="12" cy="11" r="2" />
      <path d="M9 17 L7 21" strokeOpacity={0.6} />
      <path d="M15 17 L17 21" strokeOpacity={0.6} />
    </svg>
  );
}

// ── Public export ────────────────────────────────────────────────────────────

const iconMap: Record<number, (props: IconProps) => JSX.Element> = {
  1: Icon01,
  2: Icon02,
  3: Icon03,
  4: Icon04,
  5: Icon05,
  6: Icon06,
  7: Icon07,
  8: Icon08,
  9: Icon09,
  10: Icon10,
  11: Icon11,
  12: Icon12,
};

export function ModuleIcon({
  moduleId,
  hovering = false,
  className = "",
}: {
  moduleId: number;
  hovering?: boolean;
  className?: string;
}) {
  const Icon = iconMap[moduleId];
  if (!Icon) return null;
  return (
    <span className={`inline-flex items-center justify-center transition-colors duration-150 ${className}`}>
      <Icon hovering={hovering} />
    </span>
  );
}
