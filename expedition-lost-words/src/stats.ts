export type Stats = { games: number; words: number; best: number; streak: number; lastDay: string };
const KEY = "expedition-stats";
const day = (d = new Date()) => d.toISOString().slice(0, 10);

export function loadStats(): Stats {
  try { return { games: 0, words: 0, best: 0, streak: 0, lastDay: "", ...JSON.parse(localStorage.getItem(KEY) ?? "{}") }; }
  catch { return { games: 0, words: 0, best: 0, streak: 0, lastDay: "" }; }
}

export function recordGame(score: number, found: number) {
  const s = loadStats(), today = day(), yesterday = day(new Date(Date.now() - 864e5));
  const streak = s.lastDay === today ? s.streak : s.lastDay === yesterday ? s.streak + 1 : 1;
  const next = { games: s.games + 1, words: s.words + found, best: Math.max(s.best, score), streak, lastDay: today };
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
  window.dispatchEvent(new Event("expedition-stats"));
}
