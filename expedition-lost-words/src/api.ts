import type { Coordinate, WordResult } from "./algorithm/types";

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
  if (!res.ok) throw new Error(`Server error (${res.status})`);
  return res.json();
}
const post = (b: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(b) });

export type Saved = { id: string; name: string; grid: string[][]; dictionary: string[]; savedAt: string };
export type Puzzle = { seed: string; grid: string[][]; total: number; lengths: number[] };
export type Score = { name: string; score: number; found: number; seconds: number };

export const api = {
  solve: (grid: string[][], words: string[]) => req<{ results: WordResult[]; ms: number }>("/api/solve", post({ grid, words })),
  list: () => req<Saved[]>("/api/expeditions"),
  save: (name: string, grid: string[][], dictionary: string[]) => req<Saved>("/api/expeditions", post({ name, grid, dictionary })),
  remove: (id: string) => req<{ ok: true }>(`/api/expeditions/${id}`, { method: "DELETE" }),
  puzzle: (seed?: string) => req<Puzzle>(`/api/play/puzzle${seed ? `?seed=${encodeURIComponent(seed)}` : ""}`),
  check: (seed: string, word: string, path: Coordinate[]) => req<{ ok: boolean; reason?: string; points?: number }>("/api/play/check", post({ seed, word, path })),
  submit: (seed: string, name: string, words: string[], seconds: number) => req<{ score: number; found: number; total: number; rank: number }>("/api/play/submit", post({ seed, name, words, seconds })),
  board: (seed: string) => req<Score[]>(`/api/leaderboard?seed=${encodeURIComponent(seed)}`),
};
