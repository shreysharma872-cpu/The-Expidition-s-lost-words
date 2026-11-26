# The Expedition's Lost Words

A full-stack word-hunting website. Given a grid of letters and a dictionary, it finds every word that can be traced through the grid and shows the exact route for each one, on an interactive 3D map. It also includes a daily puzzle game with server-side scoring and a leaderboard.

Built for a 6-hour, 3-person hackathon.

**Stack:** React, TypeScript, Vite, three.js, Node.js, Express.
**Core algorithm:** Trie + DFS + backtracking.

---

## 1. The problem

The program receives a rectangular grid of lowercase letters and a list of candidate dictionary words. It must return every dictionary word that can be formed by walking from cell to adjacent cell, and save one valid route for each word.

| Rule | Meaning |
| --- | --- |
| Movement | Up, down, left and right only. Diagonal moves are forbidden. |
| No cell reuse | A cell can appear only once in a single word's path. |
| Overlap allowed | Different words may share the same cells. |
| Unique output | Each word is returned once, even if it has several paths or appears twice in the dictionary. |
| Path required | One ordered row/column path is stored for every found word. |

**Official example**

```
Grid                 Dictionary              Expected
o a a n              oath, pea, eat, rain    oath, eat
e t a e
i h k r
i f l v
```

`oath` is traced as (1,1) -> (1,2) -> (2,2) -> (3,2). `eat` is traced as (2,4) -> (2,3) -> (2,2). `pea` and `rain` cannot be traced, so they are not reported.

## 2. The solution

### Why not brute force?

Checking every dictionary word against every starting cell and every route is far too slow when the dictionary has 10,000 words. Most routes are explored for words that could never match.

### Trie + DFS + backtracking

1. **Trie (prefix tree).** Insert every dictionary word into a tree of characters. Words with a shared start (`star`, `stare`, `start`) share the same nodes. A node stores the complete word if one ends there.
2. **DFS from every cell.** Start a depth-first search at each grid cell, beginning at the Trie root.
3. **Prefix pruning.** Follow the Trie child that matches the current cell's letter. If there is no such child, no dictionary word starts with these letters, so the route is abandoned immediately.
4. **Visited matrix.** Mark the cell as used and append its coordinate to the current path. A visited cell is never entered again in the same path.
5. **Record words, keep searching.** If the Trie node ends a word, save the word with a copy of the path, then continue deeper, because a longer word (`stare`) may extend a shorter one (`star`).
6. **Backtrack.** Remove the coordinate and unmark the cell before trying another route.
7. **No duplicates.** Once a word is recorded, it is cleared from its Trie node, so it is never reported twice. Dead Trie branches are also removed to speed up later searches.

### Complexity

- Building the Trie: O(total number of characters in the dictionary).
- Search: worst case O(R x C x 3^(L-1)), where L is the longest dictionary word. In practice, Trie pruning cuts almost all of that away.
- Measured result: a 10x10 grid with 10,000 words (many sharing prefixes) is solved in about 20 ms in testing.

### Data contract

```ts
type Coordinate = { row: number; col: number };           // zero-based internally
type WordResult = { word: string; path: Coordinate[] };
findWords(grid: string[][], dictionary: string[]): WordResult[]
```

Coordinates are zero-based in the code and shown as 1-based (row, column) to users.

## 3. Features

**Solver**
- Editable grid from 1x1 up to 12x12, with arrow-key navigation and auto-advance.
- Dictionary box that accepts words separated by lines, spaces or commas. Duplicates and non-letter entries are handled.
- Search results with the route for each word, a "not in the grid" list, search time and counts.
- Sample presets, including the official example and a 10x10 grid with 10,000 words.
- Optional "Solve on server" mode that runs the same algorithm through the API.
- Save, load and delete named expeditions (stored on the server).

**3D expedition map (three.js)**
- The grid is shown as a board of raised letter tiles, with fog, lighting and floating dust.
- Selecting a word lifts and lights its tiles, draws a glowing route tube, shows numbered step markers, and sends an orb along the path.
- Drag to rotate, scroll to zoom, tiles lift on hover, slow auto-rotation until you interact.
- Respects reduced-motion settings.

**Play the expedition (game mode)**
- The server generates a puzzle: today's expedition is the same for everyone, or start a random one.
- Three difficulties: Easy 4x4, Medium 5x5, Hard 6x6.
- Trace words by tapping adjacent tiles. The 3D board mirrors your trace live.
- The server verifies each route (adjacent moves, no reuse, matching letters, valid word) and awards length x length points.
- Timer, post your score under a name, and a per-expedition leaderboard (top 10).

**Hub and extras**
- Difficulty cards, how to play, personal stats (expeditions finished, words found, best score, day streak), field notes, FAQ and footer.
- Responsive layout, keyboard focus styles, reduced-motion support.

## 4. Tech used

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | React 19 + TypeScript | UI and typed data contract |
| Build tool | Vite | Dev server, bundling, API proxy |
| 3D | three.js (with OrbitControls) | Interactive 3D map, route tube, orb |
| Backend | Node.js + Express | REST API |
| Storage | JSON file (`server/data.json`) | Saved expeditions and scores |
| Dev tooling | tsx, concurrently | Run TypeScript server, start both processes |
| Typography | Instrument Serif, Hanken Grotesk | Visual design |

The search algorithm is a single shared TypeScript module, used by both the browser and the server.

## 5. Architecture

```
Browser (React + three.js)                    Server (Express)
------------------------------               ---------------------------
Solver / Play / Hub UI                        /api/solve
  |                                           /api/expeditions
  |-- findWords() runs locally   <--same-->   findWords() runs on server
  |                                    code   /api/play/puzzle  -> makePuzzle(seed)
  |-- Scene3D (WebGL)                         /api/play/check   -> checkPath()
  |                                           /api/play/submit  -> score + store
  '-- fetch("/api/...") ------ Vite proxy --> /api/leaderboard
                                                    |
                                              server/data.json
```

In development, Vite serves the website on port 5173 and forwards `/api` requests to the Express server on port 3001.

### Project structure

```
expedition-lost-words/
  index.html
  package.json  tsconfig.json  vite.config.ts
  public/favicon.svg
  server/
    index.ts            Express API
    puzzle.ts           Seeded puzzle generator, route checker, scoring
  src/
    algorithm/
      types.ts          Coordinate, WordResult
      Trie.ts           Prefix tree
      findWords.ts      DFS + backtracking search
      input.ts          Dictionary parsing and grid validation
      benchmark.ts      10x10 / 10,000-word test data
      findWords.test.ts Algorithm tests
    components/
      Scene3D.tsx       three.js map
      LetterGrid.tsx    Editable 2D grid
      DictionaryInput.tsx
      ResultsPanel.tsx
      PlayMode.tsx      Tracing game
      Library.tsx       Saved expeditions
      Sections.tsx      Hub, how to play, stats, tips, FAQ, footer
    api.ts              Typed fetch client
    stats.ts            Browser-side streaks and stats
    presets.ts          Sample puzzles
    App.tsx  main.tsx  styles.css
```

All search logic stays in `src/algorithm/`. Components only call `findWords(grid, dictionary)`.

## 6. API reference

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/health` | Server status |
| POST | `/api/solve` | Body `{ grid, words }`. Returns `{ results, ms }` |
| GET | `/api/expeditions` | List saved expeditions |
| POST | `/api/expeditions` | Save `{ name, grid, dictionary }` |
| DELETE | `/api/expeditions/:id` | Delete a saved expedition |
| GET | `/api/play/puzzle?seed=` | Get a puzzle (grid, word count, word lengths). Seed defaults to today's date |
| POST | `/api/play/check` | Verify a traced route `{ seed, word, path }` |
| POST | `/api/play/submit` | Post a score `{ seed, name, words, seconds }`. Server recomputes the score |
| GET | `/api/leaderboard?seed=` | Top 10 scores for an expedition |

**How puzzles work.** A seed string (today's date, or a random string) feeds a deterministic random generator. The generator plants words into the grid along random routes, fills the rest with letters, then runs `findWords` to get the full list of findable words. The seed suffix `~4`, `~5` or `~6` selects the grid size. The same seed always produces the same puzzle, so the server can verify answers without storing puzzles. The answer list is never sent to the browser.

## 7. Running the project

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173). This starts both the website and the API.

| Command | What it does |
| --- | --- |
| `npm run dev` | Website and API together |
| `npm run web` | Website only (play and saving need the API) |
| `npm run api` | API only (port 3001) |
| `npm test` | Algorithm tests |
| `npm run build` | Type-check and production build |

## 8. Testing

`npm test` covers the required checklist:

| Test | Expected behaviour |
| --- | --- |
| Official 4x4 example | Finds `oath` and `eat`, with the exact paths. Does not report `pea` or `rain` |
| Repeated letters | Never reuses one cell in the same path |
| Diagonal-only match | Rejected |
| Duplicate dictionary word | Reported once |
| Overlapping words | Allowed to share cells |
| Absent words / empty result | Returns an empty list without crashing |
| Shared prefixes | Finds `star`, `stare` and `start` |
| Maximum input | 10x10 grid with 10,000 words finishes quickly, every path independently re-verified |

## 9. Design decisions

- **No cell reuse and four directions** are enforced by the visited matrix and the four-offset neighbour list, so diagonal or repeated cells cannot occur.
- **One algorithm module for client and server**, so the website and the API can never disagree.
- **Server-side verification** for the game, so scores come from checked routes, not from trusting the browser.
- **JSON file storage** keeps setup to a single `npm install`, with no database to run.
- **Visual direction:** an editorial look (serif display type, chalk and sea-ink palette, brass as the one accent) with a dark 3D hero for contrast, instead of a generic dark-mode dashboard.

## 10. Known limitations

- No accounts: anyone can post a score under any name.
- Storage is a single JSON file, which suits a demo, not heavy traffic.
- Streaks and personal stats live in the browser's local storage.
- Letters are edited in the 2D grid, not by clicking tiles in the 3D view.
- The daily puzzle changes at midnight UTC.
- Game puzzles use a built-in list of about 75 words.

## 11. 60-second explanation

We build a Trie from the dictionary so common prefixes are shared. Then we run DFS from each grid cell, following only valid Trie prefixes. A visited matrix prevents cell reuse, and backtracking restores cells when a route finishes. When a complete word is found, we store its path once and keep searching for longer words. The 3D map lets you select a word and watch its exact route. On top of that, an Express backend generates daily puzzles, verifies routes, keeps a leaderboard and stores saved expeditions.

## 12. Possible next steps

- Real database and user accounts.
- Click and drag tracing directly on the 3D board.
- Archive of past daily puzzles and shareable result links.
- Sound effects and a word-definition lookup.
