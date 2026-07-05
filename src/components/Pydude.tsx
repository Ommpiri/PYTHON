import { useEffect, useRef, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { askPydude } from "@/functions/pydude";
import ReactMarkdown from "react-markdown";

type Message = { role: "user" | "pydude"; text: string };

export function Pydude() {
  const [expanded, setExpanded] = useState(false);
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
      const keys = Object.keys(localStorage).filter(k => k.startsWith(`code_${moduleName}`));
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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {expanded && (
        <div className="mb-4 w-[380px] h-[500px] max-h-[80vh] max-w-[calc(100vw-3rem)] bg-warm-black border border-border shadow-2xl rounded-lg flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
            <h3 className="font-display font-semibold flex items-center gap-2">
              <span className="text-amber">{">>>"}</span> pydude
            </h3>
            <div className="flex gap-2">
              <button onClick={() => setMessages([{ role: "pydude", text: "History cleared. How can I help?" }])} className="text-xs text-muted-foreground hover:text-coral transition-colors" title="Clear Chat">
                clear
              </button>
              <button onClick={() => setExpanded(false)} className="text-muted-foreground hover:text-white transition-colors">
                ✕
              </button>
            </div>
          </div>
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 font-mono text-sm">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-lg px-4 py-3 ${
                  m.role === "user" 
                    ? "bg-teal/20 border border-teal/30 text-teal-50" 
                    : "bg-[#F4F1EA] text-[#2C3E50] shadow-sm" // parchment style
                }`}>
                  {m.role === "pydude" ? (
                    <div className="prose prose-sm prose-pre:bg-warm-black prose-pre:text-white max-w-none">
                      <ReactMarkdown>{m.text}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{m.text}</div>
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

          <div className="p-3 border-t border-border bg-background">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask Pydude..."
                className="flex-1 bg-warm-black border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-amber transition-colors"
                disabled={loading}
              />
              <button 
                type="submit"
                disabled={!input.trim() || loading}
                className="px-3 py-2 bg-amber text-warm-black font-semibold rounded hover:bg-amber/90 disabled:opacity-50 transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {!expanded && (
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
        </button>
      )}
    </div>
  );
}
