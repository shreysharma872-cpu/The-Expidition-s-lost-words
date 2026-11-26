import { useEffect, useState } from "react";
import { loadStats } from "../stats";

const LEVELS = [
  { n: 4, name: "Easy", text: "A compact 4×4 map with a handful of short words. A good first trek." },
  { n: 5, name: "Medium", text: "The daily 5×5 expedition. Mixed word lengths and a few long routes." },
  { n: 6, name: "Hard", text: "A 6×6 map with more words and more places to get lost." },
];

export function Hub({ onPlay, onSolve }: { onPlay: (n: number) => void; onSolve: () => void }) {
  return (
    <section className="section" aria-labelledby="hub-title">
      <h2 id="hub-title" className="section-title">Choose your expedition</h2>
      <p className="section-lead">A new map is generated every day. Pick a difficulty, or paste your own grid into the solver.</p>
      <div className="hub">
        {LEVELS.map((l) => (
          <article key={l.n} className="card">
            <div className="mini" style={{ gridTemplateColumns: `repeat(${l.n}, 1fr)` }} aria-hidden="true">
              {Array.from({ length: l.n * l.n }, (_, i) => <i key={i} className={(i * 7 + l.n) % 5 === 0 ? "hot" : ""} />)}
            </div>
            <h3>{l.name}</h3>
            <p>{l.text}</p>
            <button className="primary" onClick={() => onPlay(l.n)}>Play {l.name.toLowerCase()}</button>
          </article>
        ))}
        <article className="card alt">
          <h3>Solver</h3>
          <p>Enter any grid and dictionary. See every word and its route, up to 12×12.</p>
          <button className="primary" onClick={onSolve}>Open solver</button>
        </article>
      </div>
    </section>
  );
}

export function HowTo() {
  const steps = [
    ["Look at the map", "Every tile holds one letter. Words hide in the grid."],
    ["Trace a route", "Tap tiles that touch up, down, left or right. No diagonals."],
    ["Use each tile once", "A tile can appear only once in a single word. Different words may share tiles."],
    ["Check the word", "The server confirms the route and awards length × length points."],
  ];
  return (
    <section className="section" aria-labelledby="how-title">
      <h2 id="how-title" className="section-title">How to play</h2>
      <ol className="steps">
        {steps.map(([t, d], i) => <li key={t}><span className="num">{i + 1}</span><div><h3>{t}</h3><p>{d}</p></div></li>)}
      </ol>
    </section>
  );
}

export function StatsPanel() {
  const [s, setS] = useState(loadStats);
  useEffect(() => {
    const f = () => setS(loadStats());
    window.addEventListener("expedition-stats", f);
    return () => window.removeEventListener("expedition-stats", f);
  }, []);
  const items: [string, number][] = [["Expeditions finished", s.games], ["Words found", s.words], ["Best score", s.best], ["Day streak", s.streak]];
  return (
    <section className="section band" aria-labelledby="stats-title">
      <h2 id="stats-title" className="section-title">Your journey</h2>
      <p className="section-lead">Stored in this browser. Finish an expedition each day to grow your streak.</p>
      <dl className="stats-grid">
        {items.map(([k, v]) => <div key={k}><dd>{v}</dd><dt>{k}</dt></div>)}
      </dl>
    </section>
  );
}

export function Tips() {
  const tips = [
    ["Start with short words", "Three- and four-letter words reveal where the vowels cluster."],
    ["Follow common endings", "If you find star, look for an e or t next to its last tile."],
    ["Check the length hints", "The list of word lengths tells you how many long routes remain."],
    ["Reuse tiles across words", "Overlap is allowed, so a busy tile often sits in several words."],
  ];
  return (
    <section className="section" aria-labelledby="tips-title">
      <h2 id="tips-title" className="section-title">Field notes</h2>
      <div className="tips">{tips.map(([t, d]) => <article key={t}><h3>{t}</h3><p>{d}</p></article>)}</div>
    </section>
  );
}

export function Faq() {
  const q = [
    ["How does the solver find words so quickly?", "It stores the dictionary in a Trie and walks the grid with depth-first search. A route stops the moment its letters match no dictionary prefix, and backtracking frees each tile for the next route."],
    ["Can a word use the same tile twice?", "No. Each tile appears at most once in a single word's route."],
    ["Are diagonal moves allowed?", "No. Only up, down, left and right."],
    ["When does the daily expedition change?", "At midnight UTC. Everyone gets the same map that day, so scores are comparable."],
    ["Where is my data stored?", "Scores and saved expeditions live in the server's data file. Your streak is kept in your browser."],
  ];
  return (
    <section className="section" aria-labelledby="faq-title">
      <h2 id="faq-title" className="section-title">Questions</h2>
      <div className="faq">{q.map(([a, b]) => <details key={a}><summary>{a}</summary><p>{b}</p></details>)}</div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <strong>The Expedition's Lost Words</strong>
      <span>React, TypeScript, three.js and Express. Search by Trie, DFS and backtracking.</span>
    </footer>
  );
}
