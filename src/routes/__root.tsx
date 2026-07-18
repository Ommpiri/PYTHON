import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouterState,
  useNavigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Navbar } from "@/components/Navbar";
import { Pydude } from "@/components/Pydude";
import { Toaster, toast } from "sonner";
import { useSession } from "@/hooks/useSession";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center font-mono">
        <p className="text-amber text-sm">Traceback (most recent call last):</p>
        <h1 className="mt-2 text-6xl font-display text-foreground">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          NameError: page not defined in module scope.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {">>> "}return home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-display text-foreground">RuntimeError: this page crashed</h1>
        <p className="mt-2 text-sm text-muted-foreground font-mono">{error.message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Retry
          </button>
          <a href="/" className="rounded-md border border-border px-4 py-2 text-sm font-medium">
            Home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "pycourse — Python Community Development Course" },
      {
        name: "description",
        content:
          "A 12-module beginner Python course. Real in-browser Python via Pyodide, interactive challenges, quizzes, and a signed certificate.",
      },
      { property: "og:title", content: "pycourse — Python Community Development Course" },
      {
        property: "og:description",
        content:
          "Learn Python by running real code in your browser. 12 modules, interactive demos, quizzes, and a certificate on completion.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Public+Sans:wght@400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [theme, setTheme] = useState<"ink" | "parchment">("ink");
  
  const { user, status } = useSession();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  useEffect(() => {
    const saved = (typeof localStorage !== "undefined" && localStorage.getItem("pyc-theme")) as
      "ink" | "parchment" | null;
    if (saved) setTheme(saved);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("theme-parchment", theme === "parchment");
    if (typeof localStorage !== "undefined") localStorage.setItem("pyc-theme", theme);
  }, [theme]);

  useEffect(() => {
    const onRequiresAuth = () => {
      toast("Please sign in to save your progress!", {
        description: "Your work here won't be saved until you log in.",
        action: {
          label: "Sign In",
          onClick: () => window.location.href = "/login"
        }
      });
    };
    window.addEventListener("pyc-requires-auth", onRequiresAuth);
    return () => window.removeEventListener("pyc-requires-auth", onRequiresAuth);
  }, []);

  useEffect(() => {
    if (status === "authenticated" && user && user.has_completed_onboarding === false) {
      if (!sessionStorage.getItem("onboarding_checked")) {
        sessionStorage.setItem("onboarding_checked", "true");
        if (pathname !== "/onboarding" && !pathname.startsWith("/api/auth")) {
          navigate({ to: "/onboarding", replace: true });
        }
      }
    }
  }, [status, user, pathname, navigate]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col">
        <Navbar
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === "ink" ? "parchment" : "ink"))}
        />
        <main className="flex-1">
          <Outlet />
        </main>
        <Pydude />
        <Toaster theme={theme === "ink" ? "dark" : "light"} />
        <footer className="border-t border-border py-10 px-6 font-mono text-xs text-muted-foreground">
          <div className="max-w-6xl mx-auto grid sm:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <p className="text-amber font-bold mb-2">{">>>"} pycourse</p>
              <p className="leading-5 text-muted-foreground/80">
                Companion site to the Python Community Development YouTube series. Real Python,
                running in your browser.
              </p>
            </div>

            {/* Quick nav */}
            <div>
              <p className="text-foreground/60 mb-2"># quick_nav</p>
              <nav className="flex flex-col gap-1.5">
                <a href="/modules" className="hover:text-amber transition-colors">
                  modules
                </a>
                <a href="/progress" className="hover:text-amber transition-colors">
                  my_progress
                </a>
                <a href="/badges" className="hover:text-amber transition-colors">
                  badges
                </a>
                <a href="/assignments" className="hover:text-amber transition-colors">
                  assignments
                </a>
                <a href="/whiteboard" className="hover:text-amber transition-colors">
                  whiteboard
                </a>
                <a href="/certificate" className="hover:text-amber transition-colors">
                  certificate
                </a>
              </nav>
            </div>

            {/* External */}
            <div>
              <p className="text-foreground/60 mb-2"># links</p>
              <nav className="flex flex-col gap-1.5">
                <a
                  href="https://www.youtube.com/@PythonCommunityDevelopment"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber transition-colors"
                >
                  youtube_series ↗
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber transition-colors"
                >
                  github ↗
                </a>
              </nav>
            </div>
          </div>
          <div className="max-w-6xl mx-auto mt-8 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-2">
            <span>{"# pycourse — Python Community Development"}</span>
            <span>{"exit(0)"}</span>
          </div>
        </footer>
      </div>
    </QueryClientProvider>
  );
}
