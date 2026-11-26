import { useCallback, useEffect, useState } from "react";
import { api, type Puzzle, type Score } from "../api";
import type { Coordinate } from "../algorithm/types";
import { recordGame } from "../stats";

const TODAY = new Date().toISOString().slice(0, 10);

type Props = { size: number; onSize: (n: number) => void; onBoard: (g: string[][]) => void; onTrace: (p: Coordinate[]) => void };

export default function PlayMode({ size, onSize, onBoard, onTrace }: Props) {
  const [puz, setPuz] = useState<Puzzle | null>(null);
  const [path, setPath] = useState<Coordinate[]>([]);
  const [found, setFound] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [secs, setSecs] = useState(0);
  const [done, setDone] = useState<null | { score: number; rank: number; found: number; total: number }>(null);
  const [name, setName] = useState(() => localStorage.getItem("explorer") ?? "");
  const [board, setBoard] = useState<Score[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async (seed?: string) => {
    try {
      const p = await api.puzzle(seed ?? `${TODAY}~${size}`);
      setPuz(p); setPath([]); setFound({}); setMsg(null); setSecs(0); setDone(null); setErr(null);
      onBoard(p.grid); onTrace([]);
      setBoard(await api.board(p.seed));
    } catch { setErr("Cannot reach the server. Start it with npm run dev."); }
  }, [onBoard, onTrace, size]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!puz || done) return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [puz, done]);

  const update = (p: Coordinate[]) => { setPath(p); onTrace(p); };
  const word = puz ? path.map((p) => puz.grid[p.row][p.col]).join("") : "";

  const tap = (row: number, col: number) => {
    if (done) return;
    const last = path[path.length - 1];
    if (last && last.row === row && last.col === col) return update(path.slice(0, -1));
    if (path.some((p) => p.row === row && p.col === col)) return;
    if (!last || Math.abs(last.row - row) + Math.abs(last.col - col) === 1) update([...path, { row, col }]);
  };

  const check = async () => {
    if (!puz || word.length < 3) return setMsg({ ok: false, text: "Trace at least 3 letters." });
    if (found[word]) return setMsg({ ok: false, text: `You already found ${word}.` });
    try {
      const r = await api.check(puz.seed, word, path);
      if (r.ok) { setFound((f) => ({ ...f, [word]: r.points! })); setMsg({ ok: true, text: `${word} found. +${r.points} points.` }); update([]); }
      else setMsg({ ok: false, text: r.reason ?? "Not a valid word." });
    } catch { setMsg({ ok: false, text: "Server unreachable." }); }
  };

  const finish = async () => {
    if (!puz) return;
    localStorage.setItem("explorer", name);
    const r = await api.submit(puz.seed, name, Object.keys(found), secs);
    recordGame(r.score, r.found);
    setDone(r); setBoard(await api.board(puz.seed));
  };

  const score = Object.values<number>(found).reduce((a: number, b: number) => a + b, 0);
  const clock = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;

  if (err) return <p className="error">{err}</p>;
  if (!puz) return <p className="muted">Loading expedition…</p>;

  return (
    <div className="play">
      <div className="levels" role="group" aria-label="Difficulty">
        {[[4, "Easy"], [5, "Medium"], [6, "Hard"]].map(([n, label]) => (
          <button key={n} className={size === n ? "chip on" : "chip"} aria-pressed={size === n} onClick={() => onSize(n as number)}>{label} {n}×{n}</button>
        ))}
      </div>
      <div className="play-bar">
        <span><strong>{Object.keys(found).length}</strong> of {puz.total} words</span>
        <span><strong>{score}</strong> points</span>
        <span>{clock}</span>
        <button className="chip" onClick={() => load(Math.random().toString(36).slice(2, 8) + "~" + size)}>New expedition</button>
        <button className="chip" onClick={() => load()}>Daily expedition</button>
      </div>
      <p className="muted">Expedition {puz.seed.split("~")[0]}. Word lengths to find: {[...puz.lengths].sort().join(", ")}.</p>

      <div className="play-board" style={{ gridTemplateColumns: `repeat(${puz.grid[0].length}, 1fr)` }}>
        {puz.grid.map((row, r) => row.map((ch, c) => {
          const i = path.findIndex((p) => p.row === r && p.col === c);
          return (
            <button key={`${r}${c}`} className={i >= 0 ? "tile sel" : "tile"} onClick={() => tap(r, c)} aria-label={`${ch}, row ${r + 1}, column ${c + 1}`}>
              {ch}{i >= 0 && <sup>{i + 1}</sup>}
            </button>
          );
        }))}
      </div>

      <div className="trace">
        <output className="trace-word">{word || "Tap adjacent tiles to trace a word"}</output>
        <button className="primary" onClick={check} disabled={!!done}>Check word</button>
        <button className="chip" onClick={() => update([])}>Clear</button>
      </div>
      {msg && <p className={msg.ok ? "ok" : "error"} role="status">{msg.text}</p>}

      <div className="word-list found">
        {Object.entries(found).map(([w, p]) => <span key={w} className="word active">{w} +{p}</span>)}
      </div>

      {!done ? (
        <div className="actions">
          <input className="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your explorer name" maxLength={20} aria-label="Explorer name" />
          <button className="primary" onClick={finish} disabled={Object.keys(found).length === 0}>Finish and post score</button>
        </div>
      ) : (
        <p className="ok">Posted. {done.score} points, {done.found} of {done.total} words, rank {done.rank}.</p>
      )}

      <h3>Leaderboard</h3>
      {board.length === 0 ? <p className="muted">No scores for this expedition yet. Be the first.</p> : (
        <ol className="board">
          {board.map((s, i) => <li key={i}><span>{s.name}</span><span>{s.score} pts · {s.found} words · {s.seconds}s</span></li>)}
        </ol>
      )}
    </div>
  );
}
