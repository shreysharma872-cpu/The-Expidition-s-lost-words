import { useEffect, useState } from "react";
import { api, type Saved } from "../api";

type Props = { grid: string[][]; words: string[]; onLoad: (s: Saved) => void };

export default function Library({ grid, words, onLoad }: Props) {
  const [items, setItems] = useState<Saved[]>([]);
  const [name, setName] = useState("");
  const [note, setNote] = useState<string | null>(null);

  const refresh = () => api.list().then(setItems).catch(() => setNote("Server offline: saving is unavailable."));
  useEffect(() => { refresh(); }, []);

  const save = async () => {
    try { await api.save(name, grid, words); setName(""); setNote("Saved."); refresh(); }
    catch { setNote("Could not save. Is the server running?"); }
  };

  return (
    <div className="library">
      <h3>Saved expeditions</h3>
      <div className="actions">
        <input className="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name this expedition" maxLength={40} aria-label="Expedition name" />
        <button className="chip" onClick={save}>Save current</button>
      </div>
      {note && <p className="muted">{note}</p>}
      {items.length === 0 ? <p className="muted">Nothing saved yet.</p> : (
        <ul className="saved">
          {items.map((s) => (
            <li key={s.id}>
              <button className="word" onClick={() => onLoad(s)}>{s.name}</button>
              <span className="muted">{s.grid.length}×{s.grid[0]?.length}, {s.dictionary.length} words</span>
              <button className="chip" onClick={() => api.remove(s.id).then(refresh)} aria-label={`Delete ${s.name}`}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
