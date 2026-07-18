import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Terminal, Mail, Chrome } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginRoute,
});

function LoginRoute() {
  const [csrfToken, setCsrfToken] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    fetch("/api/auth/csrf")
      .then((res) => res.json())
      .then((data) => setCsrfToken(data.csrfToken))
      .catch(console.error);
  }, []);

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md border border-border bg-card p-6 shadow-xl rounded-md font-mono">
        <div className="flex items-center gap-2 border-b border-border pb-4 mb-6">
          <Terminal className="h-5 w-5 text-amber-dark" />
          <span className="font-semibold text-foreground">auth_system</span>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          <span className="text-amber-dark">{">>> "}</span>
          Please authenticate to persist your progress and claim your certificate.
        </p>

        <form action="/api/auth/signin/google" method="POST" className="mb-4">
          <input type="hidden" name="csrfToken" value={csrfToken} />
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Chrome className="h-4 w-4" />
            <span className="font-sans">$ login --provider google</span>
          </button>
        </form>

        <div className="relative mb-4 mt-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or magic link</span>
          </div>
        </div>

        <form action="/api/auth/signin/nodemailer" method="POST" className="space-y-3">
          <input type="hidden" name="csrfToken" value={csrfToken} />
          <div className="space-y-1">
            <label htmlFor="email" className="text-xs text-muted-foreground">
              email_address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
            />
          </div>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-sm border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Mail className="h-4 w-4" />
            <span className="font-sans">$ login --provider email</span>
          </button>
        </form>
      </div>
    </div>
  );
}
