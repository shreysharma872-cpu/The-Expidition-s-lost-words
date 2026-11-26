import { useCallback, useEffect, useState } from "react";
import { findWords } from "./algorithm/findWords";
import { makeBenchmark } from "./algorithm/benchmark";
import { parseDictionary, validateGrid } from "./algorithm/input";
import type { WordResult } from "./algorithm/types";
import { PRESETS } from "./presets";
import LetterGrid from "./components/LetterGrid";
import DictionaryInput from "./components/DictionaryInput";
import ResultsPanel from "./components/ResultsPanel";
import Scene3D from "./components/Scene3D";
import PlayMode from "./components/PlayMode";
import Library from "./components/Library";
import { Hub, HowTo, StatsPanel, Tips, Faq, Footer } from "./components/Sections";
import { api, type Saved } from "./api";
import type { Coordinate } from "./algorithm/types";

const MAX_SIZE = 12;

type Stats = { ms: number; dictionary: number; found: number; ignored: number };

export default function App() {
  const [grid, setGrid] = useState<string[][]>(PRESETS[0].grid);
  const [dictText, setDictText] = useState(PRESETS[0].words.join("\n"));
  const [results, setResults] = useState<WordResult[] | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<"solve" | "play">("solve");
  const [size, setSize] = useState(5);
  const [useServer, setUseServer] = useState(false);
  const [playGrid, setPlayGrid] = useState<string[][]>(PRESETS[0].grid);
  const [playPath, setPlayPath] = useState<Coordinate[]>([]);
  const onBoard = useCallback((g: string[][]) => setPlayGrid(g), []);
  const onTrace = useCallback((p: Coordinate[]) => setPlayPath(p), []);

  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const dictCount = parseDictionary(dictText).words.length;

  const clearResults = () => {
    setResults(null);
    setMissing([]);
    setSelected(null);
    setStats(null);
  };

  const runSearch = async (g: string[][], text: string) => {
    const problem = validateGrid(g);
    if (problem) {
      setError(problem);
      clearResults();
      return;
    }
    const { words, ignored } = parseDictionary(text);
    if (words.length === 0) {
      setError("Add at least one dictionary word (letters only).");
      clearResults();
      return;
    }
    setError(null);
    let found: WordResult[];
    let ms: number;
    if (useServer) {
      try { const r = await api.solve(g, words); found = r.results; ms = r.ms; }
      catch { setError("Server unreachable. Untick \"Solve on server\" or run npm run dev."); return; }
    } else {
      const start = performance.now();
      found = findWords(g, words);
      ms = performance.now() - start;
    }
    const foundSet = new Set(found.map((r) => r.word));
    setResults(found);
    setMissing(words.filter((w) => !foundSet.has(w)));
    setSelected(found.length > 0 ? [...found].sort((a, b) => a.word.localeCompare(b.word))[0].word : null);
    setStats({ ms, dictionary: words.length, found: found.length, ignored: ignored.length });
  };

  const setCell = (r: number, c: number, value: string) => {
    setGrid((g) => g.map((row, i) => (i === r ? row.map((x, j) => (j === c ? value : x)) : row)));
    clearResults();
    setError(null);
  };

  const resize = (newRows: number, newCols: number) => {
    newRows = Math.min(MAX_SIZE, Math.max(1, newRows));
    newCols = Math.min(MAX_SIZE, Math.max(1, newCols));
    setGrid((g) =>
      Array.from({ length: newRows }, (_, r) =>
        Array.from({ length: newCols }, (_, c) => g[r]?.[c] ?? "")
      )
    );
    clearResults();
    setError(null);
  };

  const loadPreset = (i: number) => {
    setGrid(PRESETS[i].grid);
    setDictText(PRESETS[i].words.join("\n"));
    runSearch(PRESETS[i].grid, PRESETS[i].words.join("\n"));
  };

  const loadSaved = (sv: Saved) => {
    setGrid(sv.grid); setDictText(sv.dictionary.join("\n")); runSearch(sv.grid, sv.dictionary.join("\n"));
  };

  const loadBenchmark = () => {
    const { grid: g, words } = makeBenchmark();
    const text = words.join("\n");
    setGrid(g);
    setDictText(text);
    runSearch(g, text);
  };

  useEffect(() => { runSearch(PRESETS[0].grid, PRESETS[0].words.join("\n")); /* eslint-disable-next-line */ }, []);

  const go = (t: "solve" | "play", n?: number) => {
    if (n) setSize(n);
    setTab(t);
    document.getElementById("play-area")?.scrollIntoView({ behavior: "smooth" });
  };

  const activePath = results?.find((r) => r.word === selected)?.path ?? null;
  const hudWord = tab === "play" ? playPath.map((q) => playGrid[q.row]?.[q.col] ?? "").join("") : selected;

  return (
    <div className="page">
      <section className="hero">
        <Scene3D grid={tab === "play" ? playGrid : grid} path={tab === "play" ? playPath : activePath} />
        <div className="hero-copy">
          <h1>The Expedition's Lost Words</h1>
          <p>Trace hidden words across the map. Pick a found word and watch the explorer walk its route.</p>
          <div className="hero-cta">
            <button className="primary brass" onClick={() => go("play", 5)}>Play today's expedition</button>
            <button className="ghost" onClick={() => go("solve")}>Open the solver</button>
          </div>
        </div>
        <div className="hero-hud" aria-live="polite">{hudWord && <span className="hud-word">{hudWord}</span>}</div>
      </section>

      <Hub onPlay={(n) => { setSize(n); setTab("play"); document.getElementById("play-area")?.scrollIntoView({ behavior: "smooth" }); }}
           onSolve={() => { setTab("solve"); document.getElementById("play-area")?.scrollIntoView({ behavior: "smooth" }); }} />

      <nav className="tabs" id="play-area" role="tablist">
        <button role="tab" aria-selected={tab === "solve"} className={tab === "solve" ? "tab on" : "tab"} onClick={() => setTab("solve")}>Solver</button>
        <button role="tab" aria-selected={tab === "play"} className={tab === "play" ? "tab on" : "tab"} onClick={() => setTab("play")}>Play the expedition</button>
      </nav>

      {tab === "play" && <section className="panel wide"><h2>Daily expedition</h2><PlayMode size={size} onSize={setSize} onBoard={onBoard} onTrace={onTrace} /></section>}

      {tab === "solve" && <main className="layout">
        <section className="panel" aria-labelledby="grid-title">
          <h2 id="grid-title">Letter grid</h2>

          <div className="toolbar">
            <div className="size">
              <span>Rows</span>
              <button aria-label="Remove a row" onClick={() => resize(rows - 1, cols)} disabled={rows <= 1}>−</button>
              <output>{rows}</output>
              <button aria-label="Add a row" onClick={() => resize(rows + 1, cols)} disabled={rows >= MAX_SIZE}>+</button>
            </div>
            <div className="size">
              <span>Columns</span>
              <button aria-label="Remove a column" onClick={() => resize(rows, cols - 1)} disabled={cols <= 1}>−</button>
              <output>{cols}</output>
              <button aria-label="Add a column" onClick={() => resize(rows, cols + 1)} disabled={cols >= MAX_SIZE}>+</button>
            </div>
          </div>

          <LetterGrid grid={grid} onCellChange={setCell} path={activePath} />

          <p className="muted hint">Moves go up, down, left or right only. A cell can be used once per word.</p>

          <div className="presets">
            <span>Load sample</span>
            {PRESETS.map((p, i) => (
              <button key={p.name} className="chip" onClick={() => loadPreset(i)}>{p.name}</button>
            ))}
            <button className="chip" onClick={loadBenchmark}>10×10 with 10,000 words</button>
          </div>
        </section>

        <section className="panel" aria-labelledby="search-title">
          <h2 id="search-title">Dictionary and findings</h2>
          <DictionaryInput value={dictText} onChange={(v) => { setDictText(v); clearResults(); }} count={dictCount} />

          <div className="actions">
            <button className="primary" onClick={() => runSearch(grid, dictText)}>Search grid</button>
            <label className="check"><input type="checkbox" checked={useServer} onChange={(e) => setUseServer(e.target.checked)} /> Solve on server</label>
            {stats && (
              <p className="stats" aria-live="polite">
                <strong>{stats.found.toLocaleString()}</strong> of {stats.dictionary.toLocaleString()} words found in{" "}
                <strong>{stats.ms < 1 ? "<1" : stats.ms.toFixed(0)} ms</strong>
              </p>
            )}
          </div>

          {error && <p className="error" role="alert">{error}</p>}
          {stats && stats.ignored > 0 && (
            <p className="muted">Ignored {stats.ignored} entries that contain characters other than letters.</p>
          )}

          <Library grid={grid} words={parseDictionary(dictText).words} onLoad={loadSaved} />
          <ResultsPanel results={results} missing={missing} selected={selected} onSelect={setSelected} />
        </section>
      </main>}

      <HowTo />
      <StatsPanel />
      <Tips />
      <Faq />
      <Footer />
    </div>
  );
}
