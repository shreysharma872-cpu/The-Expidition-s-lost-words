import { useRef } from "react";
import type { Coordinate } from "../algorithm/types";

type Props = {
  grid: string[][];
  onCellChange: (row: number, col: number, value: string) => void;
  path: Coordinate[] | null; // highlighted route (zero-based) or null
};

export default function LetterGrid({ grid, onCellChange, path }: Props) {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const refs = useRef<Record<string, HTMLInputElement | null>>({});

  const step = new Map<string, number>();
  path?.forEach((p, i) => step.set(`${p.row},${p.col}`, i + 1));

  const focusCell = (r: number, c: number) => refs.current[`${r},${c}`]?.focus();

  return (
    <div
      className="grid-frame"
      style={{ maxWidth: `${cols * 84}px` }}
      role="group"
      aria-label="Letter grid"
    >
      <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {grid.map((row, r) =>
          row.map((letter, c) => {
            const n = step.get(`${r},${c}`);
            return (
              <div key={`${r},${c}`} className={n ? "cell on-route" : "cell"}>
                <input
                  ref={(el) => { refs.current[`${r},${c}`] = el; }}
                  value={letter}
                  maxLength={2}
                  inputMode="text"
                  autoComplete="off"
                  spellCheck={false}
                  aria-label={`Row ${r + 1}, column ${c + 1}`}
                  onFocus={(e) => e.currentTarget.select()}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^a-z]/gi, "").slice(-1).toLowerCase();
                    onCellChange(r, c, v);
                    if (v) {
                      if (c + 1 < cols) focusCell(r, c + 1);
                      else if (r + 1 < rows) focusCell(r + 1, 0);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowRight") focusCell(r, Math.min(c + 1, cols - 1));
                    else if (e.key === "ArrowLeft") focusCell(r, Math.max(c - 1, 0));
                    else if (e.key === "ArrowDown") focusCell(Math.min(r + 1, rows - 1), c);
                    else if (e.key === "ArrowUp") focusCell(Math.max(r - 1, 0), c);
                    else if (e.key === "Backspace" && !letter && c > 0) focusCell(r, c - 1);
                  }}
                />
                {n && <span className="step">{n}</span>}
              </div>
            );
          })
        )}
      </div>

      {path && path.length > 1 && (
        <svg
          key={path.map((p) => `${p.row}${p.col}`).join("-")}
          className="route"
          viewBox={`0 0 ${cols} ${rows}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polyline
            pathLength={1}
            points={path.map((p) => `${p.col + 0.5},${p.row + 0.5}`).join(" ")}
          />
        </svg>
      )}
    </div>
  );
}
