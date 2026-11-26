import { findWords } from "../src/algorithm/findWords";
import type { Coordinate } from "../src/algorithm/types";

export const WORDS = ("star stare start tart tare rate tear east seat sea tea eat oath path hat that " +
  "rain train trail tail rail late tale lane lean learn near earn nest rest tens sent seen " +
  "map camp lamp pole pale peal leap plan plane panel canal clan scan cane acne race care acre " +
  "ocean coast tide trek peak ridge river rope tent camp flag note rock sand moon sun dune").split(" ");

function rng(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  let s = h >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 0x100000000);
}

export function makePuzzle(seed: string) {
  const m = seed.match(/~(\d)$/);
  const size = m ? Math.min(7, Math.max(4, Number(m[1]))) : 5;
  const rand = rng(seed);
  const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(""));
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const order = [...new Set(WORDS)].sort(() => rand() - 0.5);
  let planted = 0;
  for (const w of order) {
    if (planted >= size + 4) break;
    for (let attempt = 0; attempt < 60; attempt++) {
      const cells: number[][] = [[Math.floor(rand() * size), Math.floor(rand() * size)]];
      const ok = (r: number, c: number, i: number) =>
        r >= 0 && c >= 0 && r < size && c < size &&
        (grid[r][c] === "" || grid[r][c] === w[i]) && !cells.some(([a, b]) => a === r && b === c);
      if (!(grid[cells[0][0]][cells[0][1]] === "" || grid[cells[0][0]][cells[0][1]] === w[0])) continue;
      let fail = false;
      for (let i = 1; i < w.length && !fail; i++) {
        const [pr, pc] = cells[i - 1];
        const opts = dirs.map(([dr, dc]) => [pr + dr, pc + dc]).filter(([r, c]) => ok(r, c, i));
        if (!opts.length) fail = true; else cells.push(opts[Math.floor(rand() * opts.length)]);
      }
      if (fail) continue;
      cells.forEach(([r, c], i) => (grid[r][c] = w[i]));
      planted++;
      break;
    }
  }
  const filler = "eeaaiioonnrrsstlcdmphbg";
  for (const row of grid) for (let c = 0; c < size; c++) if (!row[c]) row[c] = filler[Math.floor(rand() * filler.length)];
  const words = findWords(grid, WORDS).map((f) => f.word).sort();
  return { grid, words };
}

export const pointsFor = (w: string) => w.length * w.length;

export function checkPath(grid: string[][], words: string[], word: string, path: Coordinate[]): string | null {
  if (!words.includes(word)) return "Not in this expedition's dictionary.";
  if (!Array.isArray(path) || path.length !== word.length) return "Route does not match the word.";
  const used = new Set<string>();
  for (let i = 0; i < path.length; i++) {
    const { row, col } = path[i];
    if (grid[row]?.[col] !== word[i]) return "Route letters do not spell the word.";
    if (used.has(`${row},${col}`)) return "A cell was reused.";
    used.add(`${row},${col}`);
    if (i && Math.abs(row - path[i - 1].row) + Math.abs(col - path[i - 1].col) !== 1) return "Moves must be up, down, left or right.";
  }
  return null;
}
