// Input helpers (no search logic here).

export function parseDictionary(text: string): { words: string[]; ignored: string[] } {
  const seen = new Set<string>();
  const ignored: string[] = [];
  for (const token of text.split(/[\s,;]+/)) {
    const word = token.trim().toLowerCase();
    if (!word) continue;
    if (!/^[a-z]+$/.test(word)) ignored.push(token);
    else seen.add(word);
  }
  return { words: [...seen], ignored };
}

/** Returns an error message, or null if the grid is valid. */
export function validateGrid(grid: string[][]): string | null {
  if (grid.length === 0 || grid[0].length === 0) return "The grid is empty.";
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (!/^[a-z]$/i.test(grid[r][c] ?? "")) {
        return `Enter one letter in every cell (row ${r + 1}, column ${c + 1} is empty).`;
      }
    }
  }
  return null;
}
