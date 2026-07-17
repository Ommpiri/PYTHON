import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { type Progress } from "@/lib/progress";

export function useProgress() {
  const queryClient = useQueryClient();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      return Object.keys(data).length > 0 ? data : null;
    }
  });

  const { data: progress } = useQuery({
    queryKey: ["progress", session?.user?.email],
    queryFn: async () => {
      if (!session) return { completed: [], quizScores: {}, challengesPassed: {}, badges: [], activeDates: [] };
      const { getProgressFn } = await import("@/functions/progress");
      const res = await getProgressFn();
      return res || { completed: [], quizScores: {}, challengesPassed: {}, badges: [], activeDates: [] };
    },
    enabled: session !== undefined,
    initialData: { completed: [], quizScores: {}, challengesPassed: {}, badges: [], activeDates: [] } as Progress
  });

  useEffect(() => {
    const refresh = () => queryClient.invalidateQueries({ queryKey: ["progress"] });
    window.addEventListener("pyc-progress", refresh);
    return () => {
      window.removeEventListener("pyc-progress", refresh);
    };
  }, [queryClient]);

  return progress;
}
