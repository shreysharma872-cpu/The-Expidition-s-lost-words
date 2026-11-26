// Builds the "maximum input" test: 10x10 grid + 10,000 unique words with shared prefixes.

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

const LETTERS = "eeeeaaaiioonnrrttllssdcmphbgufkwyvjxqz"; // vowel/common-letter weighted

export function makeBenchmark(): { grid: string[][]; words: string[] } {
  const rand = rng(42);
  const pick = <T,>(a: ArrayLike<T>) => a[Math.floor(rand() * a.length)];

  const grid = Array.from({ length: 10 }, () =>
    Array.from({ length: 10 }, () => pick(LETTERS))
  );

  const words = new Set<string>();

  // 1. Words that really exist in the grid (random self-avoiding walks).
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  while (words.size < 400) {
    const len = 3 + Math.floor(rand() * 6);
    let r = Math.floor(rand() * 10);
    let c = Math.floor(rand() * 10);
    const seen = new Set([`${r},${c}`]);
    let w = grid[r][c];
    for (let i = 1; i < len; i++) {
      const opts = dirs
        .map(([dr, dc]) => [r + dr, c + dc])
        .filter(([nr, nc]) => nr >= 0 && nc >= 0 && nr < 10 && nc < 10 && !seen.has(`${nr},${nc}`));
      if (opts.length === 0) break;
      [r, c] = pick(opts);
      seen.add(`${r},${c}`);
      w += grid[r][c];
    }
    if (w.length >= 3) words.add(w);
  }

  // 2. Filler words built from ~150 shared stems, so many words share prefixes.
  const stems: string[] = [];
  for (let i = 0; i < 150; i++) {
    let s = "";
    for (let j = 0; j < 3 + Math.floor(rand() * 2); j++) s += pick(LETTERS);
    stems.push(s);
  }
  while (words.size < 10000) {
    let w = pick(stems);
    for (let j = 0; j < 1 + Math.floor(rand() * 4); j++) w += pick(LETTERS);
    words.add(w);
  }

  return { grid, words: [...words] };
}
