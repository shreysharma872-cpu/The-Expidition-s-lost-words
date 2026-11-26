import type { Coordinate, WordResult } from "./types";
import { Trie, TrieNode } from "./Trie";

// Four directions only. No diagonals.
const DIRECTIONS: ReadonlyArray<readonly [number, number]> = [
  [-1, 0], // up
  [1, 0], // down
  [0, -1], // left
  [0, 1], // right
];

export function findWords(grid: string[][], dictionary: string[]): WordResult[] {
  const rows = grid.length;
  const cols = rows > 0 ? grid[0].length : 0;
  if (rows === 0 || cols === 0) return [];

  // 1. Build the Trie. Duplicate dictionary words collapse automatically.
  const trie = new Trie();
  for (const raw of dictionary) {
    const word = raw.trim().toLowerCase();
    if (word) trie.insert(word);
  }

  const visited: boolean[][] = grid.map((row) => row.map(() => false));
  const path: Coordinate[] = [];
  const results: WordResult[] = [];

  function dfs(r: number, c: number, parent: TrieNode): void {
    if (r < 0 || c < 0 || r >= rows || c >= cols || visited[r][c]) return;

    // 2. Prefix pruning: no Trie child means no word continues this way.
    const letter = (grid[r][c] ?? "").toLowerCase();
    const node = parent.children.get(letter);
    if (!node) return;

    // 3. Mark visited and extend the path.
    visited[r][c] = true;
    path.push({ row: r, col: c });

    // 4. Record a complete word (once), with a COPY of the path.
    if (node.word !== null) {
      results.push({ word: node.word, path: path.map((p) => ({ ...p })) });
      node.word = null; // never report the same word twice
    }

    // 5. Keep going: longer words may extend this one.
    for (const [dr, dc] of DIRECTIONS) dfs(r + dr, c + dc, node);

    // 6. Backtrack.
    path.pop();
    visited[r][c] = false;

    // Optimisation: drop Trie branches that have nothing left to find.
    if (node.word === null && node.children.size === 0) {
      parent.children.delete(letter);
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) dfs(r, c, trie.root);
  }

  return results;
}
