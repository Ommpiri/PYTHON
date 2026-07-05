// localStorage-backed progress + quiz scores + badges. No backend.

import { modules } from "./modules";

const KEY = "pycourse-progress-v1";

export type Progress = {
  completed: string[]; // module slugs
  quizScores: Record<string, number>; // slug -> percent 0..100
  challengesPassed: Record<string, number>; // slug -> count
  badges: string[]; // badge ids
};

const empty: Progress = { completed: [], quizScores: {}, challengesPassed: {}, badges: [] };

const isBrowser = () => typeof window !== "undefined";

export function readProgress(): Progress {
  if (!isBrowser()) return empty;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    return { ...empty, ...JSON.parse(raw) };
  } catch {
    return empty;
  }
}

export function writeProgress(p: Progress) {
  if (!isBrowser()) return;
  localStorage.setItem(KEY, JSON.stringify(p));
  window.dispatchEvent(new CustomEvent("pyc-progress"));
}

export function markComplete(slug: string) {
  const p = readProgress();
  if (!p.completed.includes(slug)) p.completed.push(slug);
  recomputeBadges(p);
  writeProgress(p);
}

export function unmarkComplete(slug: string) {
  const p = readProgress();
  p.completed = p.completed.filter(s => s !== slug);
  recomputeBadges(p);
  writeProgress(p);
}

export function recordQuiz(slug: string, percent: number) {
  const p = readProgress();
  p.quizScores[slug] = Math.max(p.quizScores[slug] ?? 0, percent);
  recomputeBadges(p);
  writeProgress(p);
}

export function recordChallenge(slug: string) {
  const p = readProgress();
  p.challengesPassed[slug] = (p.challengesPassed[slug] ?? 0) + 1;
  recomputeBadges(p);
  writeProgress(p);
}

export const badgeDefs = [
  { id: "first-run", label: "first_run", desc: "Ran your first Python program." },
  { id: "quiz-master", label: "quiz_master", desc: "Scored 100% on 3+ quizzes." },
  { id: "half-way", label: "half_way", desc: "Completed 6 modules." },
  { id: "capstone", label: "capstone", desc: "Completed all 12 modules." },
  { id: "challenger", label: "challenger", desc: "Passed 5+ challenges." },
];

export function recomputeBadges(p: Progress) {
  const b = new Set(p.badges);
  const perfect = Object.values(p.quizScores).filter(v => v >= 100).length;
  if (perfect >= 3) b.add("quiz-master");
  if (p.completed.length >= 6) b.add("half-way");
  if (p.completed.length >= modules.length) b.add("capstone");
  const totalChallenges = Object.values(p.challengesPassed).reduce((a, x) => a + x, 0);
  if (totalChallenges >= 1) b.add("first-run");
  if (totalChallenges >= 5) b.add("challenger");
  p.badges = [...b];
}

export function useProgressSnapshot() {
  // read on demand; components call this via a small hook wrapper if they need reactivity.
  return readProgress();
}
