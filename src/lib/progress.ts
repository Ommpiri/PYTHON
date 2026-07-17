// localStorage-backed progress + quiz scores + badges. No backend.

import { modules } from "./modules";
import { migrateProgressFn } from "../functions/progress";

const KEY = "pycourse-progress-v1";
const MIGRATED_KEY = "pycourse-progress-migrated";

export type Progress = {
  completed: string[]; // module slugs
  quizScores: Record<string, number>; // slug -> percent 0..100
  challengesPassed: Record<string, number>; // slug -> count
  badges: string[]; // badge ids
  activeDates?: string[]; // YYYY-MM-DD local dates active
};

const empty: Progress = { completed: [], quizScores: {}, challengesPassed: {}, badges: [], activeDates: [] };

const isBrowser = () => typeof window !== "undefined";

export function getLocalDateString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function recordActivity(p: Progress) {
  if (!p.activeDates) {
    p.activeDates = [];
  }
  const today = getLocalDateString();
  if (!p.activeDates.includes(today)) {
    p.activeDates.push(today);
  }
}

export function calculateStreak(activeDates?: string[]): number {
  if (!activeDates || activeDates.length === 0) return 0;
  
  const sorted = [...new Set(activeDates)].sort((a, b) => b.localeCompare(a));
  const todayStr = getLocalDateString();
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const getLocalStringForDate = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const yestStr = getLocalStringForDate(yesterday);
  
  if (sorted[0] !== todayStr && sorted[0] !== yestStr) {
    return 0;
  }
  
  let streak = 0;
  let current = new Date(sorted[0] === todayStr ? today : yesterday);
  
  while (true) {
    const checkStr = getLocalStringForDate(current);
    if (sorted.includes(checkStr)) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
}

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

export function useProgressSnapshot() {
  // read on demand; components call this via a small hook wrapper if they need reactivity.
  // We no longer use this synchronous snapshot for rendering DB data directly.
  return empty;
}

async function getSession() {
  try {
    const res = await fetch("/api/auth/session");
    const session = await res.json();
    return Object.keys(session).length > 0;
  } catch {
    return false;
  }
}

async function updateDbProgress(updater: (p: Progress) => void) {
  const loggedIn = await getSession();
  if (!loggedIn) {
    window.dispatchEvent(new CustomEvent("pyc-requires-auth"));
    return;
  }
  
  const { getProgressFn, updateProgressFn } = await import("../functions/progress");
  let p = await getProgressFn();
  if (!p) p = { completed: [], quizScores: {}, challengesPassed: {}, badges: [] };
  
  updater(p);
  recomputeBadges(p);
  
  try {
    await updateProgressFn(p);
    window.dispatchEvent(new CustomEvent("pyc-progress"));
  } catch (err) {
    console.error("Failed to update progress", err);
  }
}

export async function markComplete(slug: string) {
  await updateDbProgress((p) => {
    if (!p.completed.includes(slug)) p.completed.push(slug);
  });
}

export async function unmarkComplete(slug: string) {
  await updateDbProgress((p) => {
    p.completed = p.completed.filter((s) => s !== slug);
  });
}

export async function recordQuiz(slug: string, percent: number) {
  await updateDbProgress((p) => {
    p.quizScores[slug] = Math.max(p.quizScores[slug] ?? 0, percent);
  });
}

export async function recordChallenge(slug: string) {
  await updateDbProgress((p) => {
    p.challengesPassed[slug] = (p.challengesPassed[slug] ?? 0) + 1;
  });
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
  const perfect = Object.values(p.quizScores).filter((v) => v >= 100).length;
  if (perfect >= 3) b.add("quiz-master");
  if (p.completed.length >= 6) b.add("half-way");
  if (p.completed.length >= modules.length) b.add("capstone");
  const totalChallenges = Object.values(p.challengesPassed).reduce((a, x) => a + x, 0);
  if (totalChallenges >= 1) b.add("first-run");
  if (totalChallenges >= 5) b.add("challenger");
  p.badges = [...b];
}

export async function checkAndMigrateProgress() {
  if (!isBrowser()) return;
  if (localStorage.getItem(MIGRATED_KEY)) return;
  
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      localStorage.setItem(MIGRATED_KEY, "true");
      return;
    }
    
    const p = { ...empty, ...JSON.parse(raw) };
    if (p.completed.length > 0 || p.badges.length > 0 || Object.keys(p.quizScores).length > 0 || Object.keys(p.challengesPassed).length > 0) {
      await migrateProgressFn(p);
      localStorage.setItem(MIGRATED_KEY, "true");
      localStorage.removeItem(KEY);
    } else {
      localStorage.setItem(MIGRATED_KEY, "true");
    }
  } catch (err) {
    console.error("Migration failed", err);
  }
}
