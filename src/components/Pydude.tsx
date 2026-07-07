import { useEffect, useRef, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { askPydude } from "@/functions/pydude";
import ReactMarkdown from "react-markdown";

type Message = { role: "user" | "pydude"; text: string };

const PreBlock = ({ children, ...rest }: any) => {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  const handleCopy = () => {
    if (preRef.current) {
      navigator.clipboard.writeText(preRef.current.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative group my-4">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 text-[10px] uppercase font-bold tracking-wider bg-black/40 hover:bg-amber hover:text-black text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-colors z-10"
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <pre
        ref={preRef}
        className="bg-warm-black text-white p-4 rounded-lg overflow-x-auto text-sm font-mono shadow-inner"
        {...rest}
      >
        {children}
      </pre>
    </div>
  );
};

export function Pydude() {
  const [expanded, setExpanded] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [gesture, setGesture] = useState<"idle" | "hi" | "welcome" | "bye">("idle");
  const scrollRef = useRef<HTMLDivElement>(null);

  const location = useLocation();

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem("pydude_history");
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    } else {
      setMessages([{ role: "pydude", text: "Hey! I'm Pydude. Need help with Python?" }]);
    }
  }, []);

  // Save history on change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("pydude_history", JSON.stringify(messages));
    }
    // Auto-scroll
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Listen for custom "explain-error" events from CodeEditor
  useEffect(() => {
    const handleExplainError = (e: CustomEvent) => {
      setExpanded(true);
      const { code, error, slug } = e.detail;
      const msg = `I got this error:\n\`\`\`\n${error}\n\`\`\`\nCan you explain what it means and how to fix my code?`;
      handleSend(msg, slug, code);
    };
    window.addEventListener("pydude-explain", handleExplainError as EventListener);
    return () => window.removeEventListener("pydude-explain", handleExplainError as EventListener);
  }, [messages, loading]);

  // Random 3D animations for the Pydude widget
  useEffect(() => {
    if (expanded) return;
    const interval = setInterval(() => {
      const gestures = ["hi", "welcome", "bye"];
      const randomGesture = gestures[Math.floor(Math.random() * gestures.length)];
      setGesture(randomGesture as "hi" | "welcome" | "bye");
      setTimeout(() => setGesture("idle"), 2000);
    }, 10000);
    return () => clearInterval(interval);
  }, [expanded]);

  const handleSend = async (text: string = input, forceSlug?: string, forceCode?: string) => {
    if (!text.trim() || loading) return;

    const newMessages = [...messages, { role: "user", text } as Message];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    // Context gathering
    const moduleName = forceSlug || location.pathname.split("/").pop() || "unknown";

    // If not forced, try to find some code for this module in localStorage
    let codeContext = forceCode || "";
    if (!codeContext && moduleName !== "unknown") {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith(`code_${moduleName}`));
      if (keys.length > 0) {
        // Just grab the first one we find for context
        codeContext = localStorage.getItem(keys[0]) || "";
      }
    }

    try {
      const reply = await askPydude({ data: { message: text, moduleName, codeContext } });
      setMessages([...newMessages, { role: "pydude", text: reply }]);
    } catch (e) {
      setMessages([...newMessages, { role: "pydude", text: "Error connecting to server." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating avatar button — always visible in bottom-right */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setExpanded(true)}
          className={`relative flex items-center justify-center hover:scale-110 transition-transform focus:outline-none ${
            gesture === "hi"
              ? "animate-hi"
              : gesture === "welcome"
                ? "animate-welcome"
                : gesture === "bye"
                  ? "animate-bye"
                  : ""
          }`}
          title="Ask Pydude"
        >
          <div className="w-16 h-16 rounded-full overflow-hidden border-[3px] border-amber shadow-[0_8px_30px_rgb(0,0,0,0.4)] bg-white flex items-center justify-center relative">
            <img
              src="/pydude.png"
              alt="Pydude AI"
              className="w-full h-full object-cover scale-[1.2] translate-y-[5%]"
            />
            {/* Inner shadow to make the avatar pop */}
            <div className="absolute inset-0 rounded-full shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)] pointer-events-none" />
          </div>
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full border-2 border-amber/50 animate-ping" />
        </button>
      </div>

      {/* Modal popup */}
      {expanded && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Pydude chat"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setExpanded(false)}
          />

          {/* Modal panel */}
          <div
            className={`relative bg-warm-black border border-border shadow-2xl rounded-xl flex flex-col overflow-hidden
              animate-in fade-in zoom-in-95 duration-200
              ${
                isMaximized
                  ? "w-[min(860px,calc(100vw-2rem))] h-[min(85vh,800px)]"
                  : "w-[min(440px,calc(100vw-2rem))] h-[min(560px,85vh)]"
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background shrink-0">
              <h3 className="font-display font-semibold flex items-center gap-2">
                <img src="/pydude.png" alt="" className="w-6 h-6 rounded-full object-cover" />
                <span className="text-amber">{">>>"}</span> pydude
              </h3>
              <div className="flex gap-3 items-center font-mono">
                <button
                  onClick={() =>
                    setMessages([{ role: "pydude", text: "History cleared. How can I help?" }])
                  }
                  className="text-xs text-muted-foreground hover:text-coral transition-colors"
                  title="Clear Chat"
                >
                  clear
                </button>
                <button
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="text-xs text-muted-foreground hover:text-amber transition-colors"
                  title={isMaximized ? "Shrink" : "Expand"}
                >
                  {isMaximized ? "shrink" : "expand"}
                </button>
                <button
                  onClick={() => setExpanded(false)}
                  className="text-muted-foreground hover:text-white transition-colors text-lg leading-none"
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 font-mono text-sm"
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-3 ${
                      m.role === "user"
                        ? "bg-teal/20 border border-teal/30 text-teal-50"
                        : "bg-[#F4F1EA] text-[#2C3E50] shadow-sm"
                    }`}
                  >
                    {m.role === "pydude" ? (
                      <div className="max-w-none">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => (
                              <p className="mb-2 last:mb-0 leading-relaxed font-sans">{children}</p>
                            ),
                            pre: ({ children }) => (
                              <pre className="my-2 bg-[#1E1E24] text-[#E5E9F0] p-3 rounded font-mono text-xs overflow-x-auto">
                                {children}
                              </pre>
                            ),
                            code: ({ children }) => (
                              <code className="bg-black/10 px-1 rounded font-mono text-xs">
                                {children}
                              </code>
                            ),
                            h1: ({ children }) => (
                              <h1 className="text-lg font-bold font-display my-2">{children}</h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-base font-bold font-display my-2">{children}</h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-sm font-bold font-display my-2">{children}</h3>
                            ),
                          }}
                        >
                          {m.text}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-lg px-4 py-3 bg-[#F4F1EA] text-[#2C3E50] shadow-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border bg-background shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Pydude..."
                  autoFocus
                  className="flex-1 bg-warm-black border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-amber transition-colors"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="px-3 py-2 bg-amber text-warm-black font-semibold font-mono rounded hover:bg-amber/90 disabled:opacity-50 transition-colors"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
