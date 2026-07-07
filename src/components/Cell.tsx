import { useState, type ReactNode } from "react";

export function Cell({
  kind,
  label,
  children,
  collapsible = false,
  icon,
}: {
  kind: "in" | "out";
  label?: string;
  children: ReactNode;
  collapsible?: boolean;
  icon?: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const isIn = kind === "in";
  return (
    <div className="flex gap-3 my-4">
      <div className="shrink-0 w-16 pt-3 text-right font-mono text-xs">
        <span className={isIn ? "text-amber" : "text-teal"}>{isIn ? "In [ ]:" : "Out[ ]:"}</span>
      </div>
      <div className={`flex-1 min-w-0 rounded-lg ${isIn ? "cell-in" : "cell-out"} overflow-hidden`}>
        {(label || collapsible || icon) && (
          <div className="flex items-center justify-between px-4 py-2 border-b border-black/10 font-mono text-xs">
            <span className={`flex items-center gap-1.5 ${isIn ? "text-warm-black/70" : "text-teal/80"}`}>
              {icon && (
                <span className={`opacity-60 ${isIn ? "text-amber" : "text-teal"}`}>{icon}</span>
              )}
              {label}
            </span>
            {collapsible && (
              <button
                onClick={() => setOpen((o) => !o)}
                className={`text-xs ${isIn ? "text-warm-black/70" : "text-teal"} hover:opacity-70`}
              >
                {open ? "[ − collapse ]" : "[ + expand ]"}
              </button>
            )}
          </div>
        )}
        {open && <div className="p-4">{children}</div>}
      </div>
    </div>
  );
}
