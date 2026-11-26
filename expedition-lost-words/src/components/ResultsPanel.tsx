import type { WordResult } from "../algorithm/types";

type Props = {
  results: WordResult[] | null; // null = no search run yet
  missing: string[];
  selected: string | null;
  onSelect: (word: string | null) => void;
};

const fmt = (r: WordResult) =>
  r.path.map((p) => `(${p.row + 1},${p.col + 1})`).join(" \u2192 ");

export default function ResultsPanel({ results, missing, selected, onSelect }: Props) {
  if (results === null) {
    return (
      <div className="empty">
        <p>Press <strong>Search grid</strong> to find which dictionary words the grid contains.</p>
      </div>
    );
  }

  const sorted = [...results].sort((a, b) => a.word.localeCompare(b.word));
  const active = sorted.find((r) => r.word === selected) ?? null;

  return (
    <div className="results">
      {sorted.length === 0 ? (
        <div className="empty">
          <p><strong>No words found.</strong> None of the dictionary words can be traced through the grid. Change a letter or add more words.</p>
        </div>
      ) : (
        <>
          <ul className="word-list" aria-label="Found words">
            {sorted.slice(0, 500).map((r) => (
              <li key={r.word}>
                <button
                  className={r.word === selected ? "word active" : "word"}
                  aria-pressed={r.word === selected}
                  onClick={() => onSelect(r.word === selected ? null : r.word)}
                >
                  {r.word}
                </button>
              </li>
            ))}
          </ul>
          {sorted.length > 500 && (
            <p className="muted">Showing the first 500 of {sorted.length.toLocaleString()} words.</p>
          )}
          <div className="path-detail" aria-live="polite">
            {active ? (
              <>
                <h3>{active.word}</h3>
                <p className="coords">{fmt(active)}</p>
                <p className="muted">Row, column. Counting from 1 at the top left.</p>
              </>
            ) : (
              <p className="muted">Select a word to see its route on the grid.</p>
            )}
          </div>
        </>
      )}

      {missing.length > 0 && (
        <details className="missing">
          <summary>{missing.length.toLocaleString()} dictionary words not in the grid</summary>
          <p>
            {missing.slice(0, 200).join(", ")}
            {missing.length > 200 ? ", \u2026" : ""}
          </p>
          <p className="muted">
            The search stops a route as soon as its letters match no dictionary prefix, so these never get explored far.
          </p>
        </details>
      )}
    </div>
  );
}
