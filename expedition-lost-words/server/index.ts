import express from "express";
import fs from "node:fs";
import path from "node:path";
import { findWords } from "../src/algorithm/findWords";
import { makePuzzle, checkPath, pointsFor } from "./puzzle";

const FILE = path.join(process.cwd(), "server", "data.json");
type DB = { expeditions: any[]; scores: any[] };
const load = (): DB => { try { return JSON.parse(fs.readFileSync(FILE, "utf8")); } catch { return { expeditions: [], scores: [] }; } };
const save = (d: DB) => fs.writeFileSync(FILE, JSON.stringify(d, null, 2));
const today = () => new Date().toISOString().slice(0, 10);
const clean = (s: unknown, n: number) => String(s ?? "").replace(/[<>]/g, "").trim().slice(0, n);

const app = express();
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_q, r) => r.json({ ok: true, date: today() }));

// Solver on the server (same algorithm as the browser)
app.post("/api/solve", (q, r) => {
  const { grid, words } = q.body ?? {};
  if (!Array.isArray(grid) || !Array.isArray(words)) return r.status(400).json({ error: "grid and words required" });
  const t = performance.now();
  const results = findWords(grid, words);
  r.json({ results, ms: performance.now() - t });
});

// Saved expeditions
app.get("/api/expeditions", (_q, r) => r.json(load().expeditions));
app.post("/api/expeditions", (q, r) => {
  const { name, grid, dictionary } = q.body ?? {};
  if (!Array.isArray(grid) || !Array.isArray(dictionary)) return r.status(400).json({ error: "grid and dictionary required" });
  const d = load();
  const item = { id: Date.now().toString(36), name: clean(name, 40) || "Untitled expedition", grid, dictionary, savedAt: new Date().toISOString() };
  d.expeditions.unshift(item); d.expeditions = d.expeditions.slice(0, 50); save(d);
  r.json(item);
});
app.delete("/api/expeditions/:id", (q, r) => {
  const d = load(); d.expeditions = d.expeditions.filter((e) => e.id !== q.params.id); save(d); r.json({ ok: true });
});

// Game: daily / random expedition
app.get("/api/play/puzzle", (q, r) => {
  const seed = clean(q.query.seed, 40) || today();
  const p = makePuzzle(seed);
  r.json({ seed, grid: p.grid, total: p.words.length, lengths: p.words.map((w) => w.length) });
});
app.post("/api/play/check", (q, r) => {
  const { seed, word, path: p } = q.body ?? {};
  const puz = makePuzzle(clean(seed, 40) || today());
  const err = checkPath(puz.grid, puz.words, clean(word, 20), p);
  r.json(err ? { ok: false, reason: err } : { ok: true, points: pointsFor(word) });
});
app.post("/api/play/submit", (q, r) => {
  const { seed, name, words, seconds } = q.body ?? {};
  const s = clean(seed, 40) || today();
  const puz = makePuzzle(s);
  const valid = [...new Set<string>((Array.isArray(words) ? words : []).map(String))].filter((w) => puz.words.includes(w));
  const score = valid.reduce((a, w) => a + pointsFor(w), 0);
  const d = load();
  d.scores.push({ seed: s, name: clean(name, 20) || "Explorer", score, found: valid.length, seconds: Math.max(0, Math.round(Number(seconds) || 0)), at: new Date().toISOString() });
  save(d);
  const board = d.scores.filter((x) => x.seed === s).sort((a, b) => b.score - a.score || a.seconds - b.seconds);
  r.json({ score, found: valid.length, total: puz.words.length, rank: board.findIndex((x) => x.score === score && x.name === (clean(name, 20) || "Explorer")) + 1 });
});
app.get("/api/leaderboard", (q, r) => {
  const s = clean(q.query.seed, 40) || today();
  r.json(load().scores.filter((x) => x.seed === s).sort((a, b) => b.score - a.score || a.seconds - b.seconds).slice(0, 10));
});

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
