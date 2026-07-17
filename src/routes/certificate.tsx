import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { modules } from "@/lib/modules";
import { useProgress } from "@/hooks/useProgress";
import { toast } from "sonner";

export const Route = createFileRoute("/certificate")({
  head: () => ({
    meta: [
      { title: "Certificate — pycourse" },
      {
        name: "description",
        content: "Auto-generated certificate on completion of the 12-module course.",
      },
    ],
  }),
  component: CertificatePage,
});

const MAX_NAME = 40; // characters before certificate box overflows

function CertificatePage() {
  const p = useProgress();
  const [name, setName] = useState("");
  const complete = p.completed.length >= modules.length;
  const ref = useRef<HTMLDivElement>(null);

  const print = () => window.print();

  // Pad/clamp name to fit the ASCII box
  const safeName = name.slice(0, MAX_NAME);
  const paddedName = safeName.padEnd(MAX_NAME);

  const today = new Date().toISOString().slice(0, 10);

  const generateCertificateImage = async (): Promise<Blob | null> => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Background - dark deep ink color
    ctx.fillStyle = "#0c0d12"; // Match oklch(0.15_0.02_240) approx hex
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border (amber)
    ctx.strokeStyle = "rgba(245, 158, 11, 0.6)"; // amber/60
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Command line prompt (muted gray)
    ctx.fillStyle = "#a3a3a3"; // neutral-400
    ctx.font = "14px Courier New, monospace";
    ctx.fillText(`$ ./certificate --for "${safeName || "___________"}"`, 50, 60);

    // ASCII Certificate frame (teal color)
    ctx.fillStyle = "#0d9488"; // teal-600
    ctx.font = "15px Courier New, monospace";

    const lines = [
      "+--------------------------------------------------+",
      "|                                                  |",
      "|         CERTIFICATE  OF  COMPLETION              |",
      "|                                                  |",
      "|   this is to certify that                        |",
      "|                                                  |",
      `|      ${paddedName.slice(0, 42)}  |`,
      "|                                                  |",
      "|   has completed all twelve modules of            |",
      "|                                                  |",
      "|      Python Community Development Course         |",
      "|                                                  |",
      "|   modules  : 12 / 12                             |",
      `|   issued   : ${today}                       |`,
      "|   signed   : >>> pycourse                        |",
      "|                                                  |",
      "+--------------------------------------------------+"
    ];

    let y = 100;
    for (const line of lines) {
      ctx.fillText(line, 50, y);
      y += 18;
    }

    // Success response text (amber)
    ctx.fillStyle = "#f59e0b"; // amber-500
    ctx.font = "14px Courier New, monospace";
    ctx.fillText("exit code: 0 — congratulations.", 50, y + 25);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, "image/png");
    });
  };

  return (
    <>
      {/* Print-only styles: hide chrome, show only the cert box */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #cert-print-root { display: block !important; }
          #cert-print-root * { display: revert !important; }
        }
      `}</style>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <p className="font-mono text-xs text-amber"># certificate.generate()</p>
        <h1 className="mt-2 text-4xl font-display">Certificate of completion</h1>

        {!complete ? (
          <div className="mt-6 rounded border border-coral/40 bg-coral/5 p-6 font-mono text-sm">
            <p className="text-coral">AssertionError: not all modules complete</p>
            <p className="mt-2 text-muted-foreground">
              completed = {p.completed.length} / {modules.length}. Finish the remaining modules to
              unlock your certificate.
            </p>
            <div className="mt-4 h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-amber transition-all"
                style={{ width: `${Math.round((p.completed.length / modules.length) * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {Math.round((p.completed.length / modules.length) * 100)}% complete
            </p>
          </div>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap gap-3 items-center">
              <div className="flex-1 min-w-[220px] relative">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, MAX_NAME))}
                  placeholder="your full name"
                  maxLength={MAX_NAME}
                  className="w-full px-3 py-2 rounded border border-border bg-background text-foreground font-mono outline-none focus:border-amber"
                />
                {name.length >= MAX_NAME - 5 && (
                  <p className="absolute -bottom-5 left-0 text-[10px] text-coral font-mono">
                    {name.length}/{MAX_NAME} characters
                  </p>
                )}
              </div>
              <button
                onClick={print}
                disabled={!name.trim()}
                className="px-4 py-2 rounded bg-amber text-primary-foreground text-xs font-mono font-semibold disabled:opacity-60 cursor-pointer"
              >
                print / save as pdf
              </button>
            </div>

            {name.trim() && (
              <div className="mt-4 flex flex-wrap gap-2.5">
                <button
                  onClick={async () => {
                    try {
                      const blob = await generateCertificateImage();
                      if (!blob) throw new Error("Could not generate image");
                      await navigator.clipboard.write([
                        new ClipboardItem({ "image/png": blob })
                      ]);
                      toast.success("Certificate image copied to clipboard!");
                    } catch (e: any) {
                      toast.error(`Clipboard write failed: ${e.message || e}`);
                    }
                  }}
                  className="px-3.5 py-1.5 rounded border border-amber/40 hover:bg-amber/10 text-amber text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  📋 Copy Certificate Image
                </button>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    `I just completed the pycourse 12-module Python interactive course! 🎓 Here's my certificate for "${safeName}": https://pycourse.dev`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded border border-sky-500/40 hover:bg-sky-500/10 text-sky-400 text-xs font-mono font-semibold transition-colors flex items-center gap-1.5"
                >
                  🐦 Share on X
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                    "https://pycourse.dev"
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded border border-blue-600/40 hover:bg-blue-600/10 text-blue-400 text-xs font-mono font-semibold transition-colors flex items-center gap-1.5"
                >
                  💼 Share on LinkedIn
                </a>
              </div>
            )}

            <div
              id="cert-print-root"
              ref={ref}
              className="mt-10 rounded-lg border border-amber/60 bg-[oklch(0.15_0.02_240)] p-8 sm:p-12 font-mono text-sm shadow-2xl"
            >
              <p className="text-muted-foreground">
                $ ./certificate --for "{safeName || "___________"}"
              </p>
              <pre className="text-teal mt-4 whitespace-pre leading-6 text-[0.85rem] overflow-x-auto">
                {`+--------------------------------------------------+
|                                                  |
|         CERTIFICATE  OF  COMPLETION              |
|                                                  |
|   this is to certify that                        |
|                                                  |
|      ${paddedName.slice(0, 42)}  |
|                                                  |
|   has completed all twelve modules of            |
|                                                  |
|      Python Community Development Course         |
|                                                  |
|   modules  : 12 / 12                             |
|   issued   : ${today}                       |
|   signed   : >>> pycourse                        |
|                                                  |
+--------------------------------------------------+`}
              </pre>
              <p className="mt-4 text-amber">exit code: 0 — congratulations.</p>
            </div>
          </>
        )}
      </div>
    </>
  );
}
