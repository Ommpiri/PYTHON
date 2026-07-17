import { Link, useLocation } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export function Navbar({
  theme,
  onToggleTheme,
}: {
  theme: "ink" | "parchment";
  onToggleTheme: () => void;
}) {
  const loc = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      return Object.keys(data).length > 0 ? data : null;
    },
  });

  useEffect(() => {
    fetch("/api/auth/csrf")
      .then((res) => res.json())
      .then((data) => setCsrfToken(data.csrfToken))
      .catch(console.error);
  }, []);

  const isActive = (path: string) =>
    loc.pathname === path || (path !== "/" && loc.pathname.startsWith(path));

  const navLinks: { to: string; label: string }[] = [
    { to: "/playground", label: "playground" },
    { to: "/whiteboard", label: "whiteboard" },
    { to: "/modules", label: "modules" },
    { to: "/progress", label: "my_progress" },
    { to: "/badges", label: "badges" },
    { to: "/assignments", label: "assignments" },
    { to: "/certificate", label: "certificate" },
  ];

  const linkCls = (to: string) =>
    `font-mono text-xs px-2 py-1 rounded transition-colors ${
      isActive(to) ? "text-amber" : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <header className="border-b border-border sticky top-0 z-40 backdrop-blur bg-background/85">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="font-mono text-sm font-bold shrink-0">
          <span className="text-amber">{">>>"}</span>{" "}
          <span className="text-foreground">pycourse</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {navLinks.map(({ to, label }) => (
            <Link key={to} to={to} className={linkCls(to)}>
              {label}
            </Link>
          ))}
          <button
            onClick={onToggleTheme}
            title="Toggle theme"
            className="ml-2 font-mono text-xs px-2 py-1 border border-border rounded hover:text-amber transition-colors"
            aria-label="Toggle color theme"
          >
            {theme === "ink" ? "▊ ink" : "▊ paper"}
          </button>
          
          <div className="ml-4 pl-4 border-l border-border flex items-center gap-3 font-mono text-xs">
            {session ? (
              <>
                {session.user?.image && (
                  <img src={session.user.image} alt="Avatar" className="w-5 h-5 rounded-full" />
                )}
                <span className="text-muted-foreground truncate max-w-[100px]">
                  {session.user?.name || session.user?.email}
                </span>
                <form action="/api/auth/signout" method="POST">
                  <input type="hidden" name="csrfToken" value={csrfToken} />
                  <button type="submit" className="text-muted-foreground hover:text-amber transition-colors">
                    [sign_out]
                  </button>
                </form>
              </>
            ) : (
              <Link to="/login" className="text-muted-foreground hover:text-amber transition-colors">
                [sign_in]
              </Link>
            )}
          </div>
        </nav>

        {/* Mobile: theme toggle + hamburger */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            onClick={onToggleTheme}
            title="Toggle theme"
            className="font-mono text-xs px-2 py-1 border border-border rounded hover:text-amber transition-colors"
            aria-label="Toggle color theme"
          >
            {theme === "ink" ? "▊" : "◻"}
          </button>
          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
            className="font-mono text-xs px-2 py-1 border border-border rounded hover:text-amber transition-colors"
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <nav
          className="sm:hidden border-t border-border bg-background/95 backdrop-blur px-4 py-3 flex flex-col gap-1"
          onClick={() => setMobileOpen(false)}
        >
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`block py-2 px-2 rounded font-mono text-sm ${
                isActive(to)
                  ? "text-amber bg-secondary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isActive(to) ? "▸ " : "  "}
              {label}
            </Link>
          ))}
          <div className="mt-2 pt-2 border-t border-border flex flex-col gap-2">
            {session ? (
              <>
                <div className="flex items-center gap-2 px-2 py-1 font-mono text-sm text-muted-foreground">
                  {session.user?.image && (
                    <img src={session.user.image} alt="Avatar" className="w-5 h-5 rounded-full" />
                  )}
                  <span>{session.user?.name || session.user?.email}</span>
                </div>
                <form action="/api/auth/signout" method="POST">
                  <input type="hidden" name="csrfToken" value={csrfToken} />
                  <button type="submit" className="w-full text-left px-2 py-2 rounded font-mono text-sm text-muted-foreground hover:text-foreground">
                    [sign_out]
                  </button>
                </form>
              </>
            ) : (
              <Link to="/login" className="px-2 py-2 rounded font-mono text-sm text-muted-foreground hover:text-foreground">
                [sign_in]
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
