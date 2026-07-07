import { useState } from "react";

interface CopyButtonProps {
  code: string;
}

export function CopyButton({ code }: CopyButtonProps) {
  const [state, setState] = useState<"idle" | "copied">("idle");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setState("copied");
      const timer = setTimeout(() => setState("idle"), 1500);
      return () => clearTimeout(timer);
    } catch {
      // clipboard unavailable — silently ignore
    }
  };

  return (
    <button
      onClick={copy}
      title={state === "copied" ? "Copied!" : "Copy code"}
      aria-label={state === "copied" ? "Copied!" : "Copy code"}
      className={`absolute top-2 right-2 z-10 opacity-0 group-hover/code:opacity-100 p-1.5 rounded
        border transition-all duration-150
        ${
          state === "copied"
            ? "bg-teal/15 border-teal/40 text-teal"
            : "bg-white/5 border-white/15 text-muted-foreground hover:bg-white/15 hover:text-teal hover:border-teal/50"
        }`}
    >
      {state === "idle" ? (
        /* Copy icon */
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <rect x="4" y="4" width="7" height="7" rx="1" />
          <path d="M8 4V2.5A1.5 1.5 0 0 0 6.5 1h-4A1.5 1.5 0 0 0 1 2.5v4A1.5 1.5 0 0 0 2.5 8H4" />
        </svg>
      ) : (
        /* Checkmark icon */
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M1.5 6.5 L4.5 9.5 L10.5 3.5" />
        </svg>
      )}
    </button>
  );
}
