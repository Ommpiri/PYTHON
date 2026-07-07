import { useState } from "react";

type Comment = { author: string; text: string; time: string };

const seed: Record<string, Comment[]> = {
  default: [
    { author: "priya", text: "The typewriter hero is such a nice touch.", time: "2h" },
    {
      author: "sam",
      text: "Finally a course where I can run code without leaving the page.",
      time: "1d",
    },
  ],
};

export function CommentThread({ slug }: { slug: string }) {
  const [items, setItems] = useState<Comment[]>(seed.default);
  const [text, setText] = useState("");

  const post = () => {
    if (!text.trim()) return;
    setItems((i) => [{ author: "you", text: text.trim(), time: "now" }, ...i]);
    setText("");
  };

  return (
    <div className="font-mono text-sm">
      <p className="text-warm-black/60 mb-2"># comments · {slug}</p>
      <div className="flex gap-2 mb-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="say something…"
          className="flex-1 min-w-0 px-3 py-2 rounded border border-black/15 bg-white/60 text-warm-black outline-none focus:border-amber"
          onKeyDown={(e) => {
            if (e.key === "Enter") post();
          }}
        />
        <button
          onClick={post}
          className="px-3 py-2 rounded bg-amber text-primary-foreground text-xs font-semibold"
        >
          post
        </button>
      </div>
      <ul className="space-y-2">
        {items.map((c, i) => (
          <li key={i} className="border-l-2 border-amber/50 pl-3">
            <p>
              <span className="text-teal">@{c.author}</span>{" "}
              <span className="text-warm-black/40 text-xs">· {c.time}</span>
            </p>
            <p className="text-warm-black">{c.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
