import assert from "node:assert/strict";
import { findWords } from "./findWords";
import { makeBenchmark } from "./benchmark";
import type { WordResult } from "./types";

const g = (...rows: string[]) => rows.map((r) => r.split(""));
const names = (r: WordResult[]) => r.map((x) => x.word).sort();

/** Independently re-checks that a path really spells the word under the rules. */
function assertValidPath({ word, path }: WordResult, grid: string[][]) {
  assert.equal(path.length, word.length, `${word}: path length`);
  const used = new Set<string>();
  path.forEach((p, i) => {
    assert.equal(grid[p.row][p.col], word[i], `${word}: letter ${i}`);
    const key = `${p.row},${p.col}`;
    assert.ok(!used.has(key), `${word}: cell reused`);
    used.add(key);
    if (i > 0) {
      const d = Math.abs(p.row - path[i - 1].row) + Math.abs(p.col - path[i - 1].col);
      assert.equal(d, 1, `${word}: non-adjacent / diagonal step`);
    }
  });
}

const tests: Array<[string, () => void]> = [
  ["official 4x4 example", () => {
    const grid = g("oaan", "etae", "ihkr", "iflv");
    const res = findWords(grid, ["oath", "pea", "eat", "rain"]);
    assert.deepEqual(names(res), ["eat", "oath"]);
    res.forEach((r) => assertValidPath(r, grid));
    const oath = res.find((r) => r.word === "oath")!;
    assert.deepEqual(oath.path.map((p) => [p.row + 1, p.col + 1]), [[1, 1], [1, 2], [2, 2], [3, 2]]);
  }],
  ["repeated letters need distinct cells", () => {
    assert.deepEqual(findWords(g("ab"), ["aba"]), []);        // only one 'a'
    assert.deepEqual(names(findWords(g("aba"), ["aba"])), ["aba"]);
  }],
  ["diagonal-only match is rejected", () => {
    assert.deepEqual(findWords(g("ax", "xb"), ["ab"]), []);
  }],
  ["duplicate dictionary words appear once", () => {
    assert.equal(findWords(g("ab"), ["ab", "ab", "AB"]).length, 1);
  }],
  ["overlapping words may share cells", () => {
    assert.deepEqual(names(findWords(g("abc"), ["ab", "bc", "abc"])), ["ab", "abc", "bc"]);
  }],
  ["no words found returns empty array", () => {
    assert.deepEqual(findWords(g("ab", "cd"), ["zzz"]), []);
    assert.deepEqual(findWords([], ["a"]), []);
  }],
  ["shared prefixes: star, stare, start", () => {
    const grid = g("stare", "qwxtz");
    const res = findWords(grid, ["star", "stare", "start", "stars"]);
    assert.deepEqual(names(res), ["star", "stare", "start"]);
    res.forEach((r) => assertValidPath(r, grid));
  }],
  ["10x10 grid + 10,000 words", () => {
    const { grid, words } = makeBenchmark();
    assert.equal(words.length, 10000);
    const t = performance.now();
    const res = findWords(grid, words);
    const ms = performance.now() - t;
    res.forEach((r) => assertValidPath(r, grid));
    assert.equal(new Set(res.map((r) => r.word)).size, res.length);
    console.log(`    ${res.length} words found in ${ms.toFixed(0)} ms`);
    assert.ok(res.length > 0 && ms < 3000);
  }],
];

let failed = 0;
for (const [name, fn] of tests) {
  try { fn(); console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}\n    ${(e as Error).message}`); }
}
console.log(failed ? `\n${failed} failed` : "\nAll tests passed");
process.exit(failed ? 1 : 0);
