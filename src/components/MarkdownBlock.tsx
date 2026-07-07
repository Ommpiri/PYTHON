import type { ReactNode } from "react";

// Lightweight inline markdown parser — no external deps.
// Handles: **bold**, *italic*, `code`, and plain text.
function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[2] !== undefined) nodes.push(<strong key={m.index}>{m[2]}</strong>);
    else if (m[3] !== undefined) nodes.push(<em key={m.index}>{m[3]}</em>);
    else if (m[4] !== undefined)
      nodes.push(
        <code key={m.index} className="bg-black/10 px-1 rounded text-[0.85em] font-mono">
          {m[4]}
        </code>,
      );
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function MarkdownBlock({ children }: { children: string }) {
  if (!children) return null;
  const lines = children.split("\n");
  const out: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Fenced code block
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      out.push(
        <pre
          key={`code-${i}`}
          className="my-3 rounded-md bg-[oklch(0.16_0.02_240)] p-4 text-teal font-mono text-xs leading-6 overflow-x-auto"
          data-lang={lang || undefined}
        >
          <code>{codeLines.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    // Headings
    const hm = line.match(/^(#{1,4})\s+(.*)/);
    if (hm) {
      const level = hm[1].length;
      const text = parseInline(hm[2]);
      const cls = [
        "font-display font-semibold text-warm-black",
        level === 1
          ? "mt-6 mb-2 text-2xl"
          : level === 2
            ? "mt-5 mb-2 text-xl"
            : "mt-4 mb-1 text-lg",
      ].join(" ");
      const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4";
      out.push(
        <Tag key={`h-${i}`} className={cls}>
          {text}
        </Tag>,
      );
      i++;
      continue;
    }

    // Unordered list (collect consecutive items)
    if (/^[-*]\s/.test(line)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push(
          <li key={i} className="ml-5 list-disc">
            {parseInline(lines[i].replace(/^[-*]\s/, ""))}
          </li>,
        );
        i++;
      }
      out.push(
        <ul key={`ul-${i}`} className="my-3 space-y-1 text-warm-black leading-7">
          {items}
        </ul>,
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(
          <li key={i} className="ml-6 list-decimal">
            {parseInline(lines[i].replace(/^\d+\.\s/, ""))}
          </li>,
        );
        i++;
      }
      out.push(
        <ol key={`ol-${i}`} className="my-3 space-y-1 text-warm-black leading-7">
          {items}
        </ol>,
      );
      continue;
    }

    // Block quote
    if (line.startsWith("> ")) {
      out.push(
        <blockquote
          key={`bq-${i}`}
          className="my-3 border-l-4 border-amber pl-4 text-warm-black/70 italic"
        >
          {parseInline(line.slice(2))}
        </blockquote>,
      );
      i++;
      continue;
    }

    // Paragraph — collect consecutive non-special lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^#{1,4}\s/.test(lines[i]) &&
      !/^[-*]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !lines[i].startsWith("```") &&
      !lines[i].startsWith("> ")
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      out.push(
        <p key={`p-${i}`} className="my-3 text-warm-black leading-7">
          {parseInline(paraLines.join(" "))}
        </p>,
      );
    }
  }

  return <>{out}</>;
}
