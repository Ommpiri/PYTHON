import { useState } from "react";

type Comment = {
  id: string;
  author: string;
  text: string;
  time: string;
  replies?: Comment[];
};

const seed: Comment[] = [
  {
    id: "seed-1",
    author: "priya",
    text: "The typewriter hero is such a nice touch.",
    time: "2h ago",
    replies: [
      {
        id: "seed-1-1",
        author: "alex",
        text: "Totally agree! Made it super engaging.",
        time: "1h ago",
      },
    ],
  },
  {
    id: "seed-2",
    author: "sam",
    text: "Finally a course where I can run code without leaving the page.",
    time: "1d ago",
    replies: [],
  },
];

export function CommentThread({ slug }: { slug: string }) {
  const storageKey = `pycourse-comments-v1-${slug}`;
  const [items, setItems] = useState<Comment[]>(() => {
    if (typeof window === "undefined") return seed;
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : seed;
    } catch {
      return seed;
    }
  });

  const [text, setText] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const saveComments = (newItems: Comment[]) => {
    setItems(newItems);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(newItems));
    }
  };

  const post = () => {
    if (!text.trim()) return;
    const newComment: Comment = {
      id: Math.random().toString(36).substring(2, 9),
      author: "you",
      text: text.trim(),
      time: "now",
      replies: [],
    };
    saveComments([newComment, ...items]);
    setText("");
  };

  const postReply = (parentId: string) => {
    if (!replyText.trim()) return;
    const newReply: Comment = {
      id: Math.random().toString(36).substring(2, 9),
      author: "you",
      text: replyText.trim(),
      time: "now",
    };

    const updated = items.map((c) => {
      if (c.id === parentId) {
        return { ...c, replies: [...(c.replies || []), newReply] };
      }
      return c;
    });

    saveComments(updated);
    setReplyText("");
    setReplyToId(null);
  };

  return (
    <div className="font-mono text-sm">
      <p className="text-warm-black/60 mb-2"># comments · {slug}</p>
      <div className="flex gap-2 mb-4">
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
          className="px-3 py-2 rounded bg-amber text-primary-foreground text-xs font-semibold cursor-pointer"
        >
          post
        </button>
      </div>
      <ul className="space-y-4">
        {items.map((c) => (
          <li key={c.id} className="border-l-2 border-amber/40 pl-3.5 py-1">
            <div>
              <span className="text-teal font-semibold">@{c.author}</span>{" "}
              <span className="text-warm-black/40 text-xs">· {c.time}</span>
            </div>
            <p className="text-warm-black mt-1">{c.text}</p>

            <div className="mt-1">
              <button
                onClick={() => setReplyToId(replyToId === c.id ? null : c.id)}
                className="text-[11px] text-muted-foreground hover:text-amber font-semibold cursor-pointer"
              >
                reply
              </button>
            </div>

            {/* Inline reply form */}
            {replyToId === c.id && (
              <div className="flex gap-2 mt-2 pl-3">
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="write a reply…"
                  className="flex-1 min-w-0 px-2 py-1 text-xs rounded border border-black/15 bg-white/60 text-warm-black outline-none focus:border-amber"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") postReply(c.id);
                  }}
                  autoFocus
                />
                <button
                  onClick={() => postReply(c.id)}
                  className="px-2 py-1 rounded bg-amber text-primary-foreground text-[10px] font-semibold cursor-pointer"
                >
                  reply
                </button>
              </div>
            )}

            {/* Child replies */}
            {c.replies && c.replies.length > 0 && (
              <ul className="mt-3 space-y-2.5 pl-4 border-l border-black/10">
                {c.replies.map((r) => (
                  <li key={r.id} className="py-0.5">
                    <div>
                      <span className="text-teal/80 font-medium">@{r.author}</span>{" "}
                      <span className="text-warm-black/40 text-xs">· {r.time}</span>
                    </div>
                    <p className="text-warm-black/90 mt-0.5">{r.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
