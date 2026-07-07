// Line-art 12×12 SVG icons for Cell section headers.
// All icons use currentColor stroke, no fills, terminal aesthetic.

const base = {
  width: 12,
  height: 12,
  viewBox: "0 0 12 12",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/** Open book — Theory */
export function IconBook({ className = "" }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <path d="M6 10V2C6 2 4.5 1 2 2v8c2.5-1 4 0 4 0z" />
      <path d="M6 10V2c0 0 1.5-1 4 0v8c-2.5-1-4 0-4 0z" />
    </svg>
  );
}

/** Play triangle — Live Coding */
export function IconPlay({ className = "" }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <polygon points="2,1 10,6 2,11" />
    </svg>
  );
}

/** Terminal screen — Demo / Out cell */
export function IconTerminal({ className = "" }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <rect x="1" y="1" width="10" height="8" rx="1" />
      <polyline points="3,4 5,6 3,8" />
      <line x1="6" y1="8" x2="9" y2="8" />
      <line x1="3" y1="11" x2="9" y2="11" />
    </svg>
  );
}

/** Gear / wrench — Challenge */
export function IconGear({ className = "" }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <circle cx="6" cy="6" r="2" />
      <line x1="6" y1="1" x2="6" y2="3" />
      <line x1="6" y1="9" x2="6" y2="11" />
      <line x1="1" y1="6" x2="3" y2="6" />
      <line x1="9" y1="6" x2="11" y2="6" />
      <line x1="2.5" y1="2.5" x2="3.9" y2="3.9" />
      <line x1="8.1" y1="8.1" x2="9.5" y2="9.5" />
      <line x1="9.5" y1="2.5" x2="8.1" y2="3.9" />
      <line x1="3.9" y1="8.1" x2="2.5" y2="9.5" />
    </svg>
  );
}

/** Question mark in box — Quiz */
export function IconQuiz({ className = "" }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <rect x="1" y="1" width="10" height="10" rx="1.5" />
      <path d="M4 4.5a2 2 0 0 1 4 0c0 1.5-2 1.5-2 3" />
      <circle cx="6" cy="9" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Speech bubble — Discussion */
export function IconDiscussion({ className = "" }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <path d="M10 1H2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2l2 2 2-2h2a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z" />
    </svg>
  );
}
