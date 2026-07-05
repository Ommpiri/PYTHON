import { useEffect, useState } from "react";
import { readProgress, type Progress } from "@/lib/progress";

export function useProgress() {
  const [p, setP] = useState<Progress>(() => readProgress());
  useEffect(() => {
    const refresh = () => setP(readProgress());
    refresh();
    window.addEventListener("pyc-progress", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("pyc-progress", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return p;
}
