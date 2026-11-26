# The Expedition's Lost Words

Find every dictionary word that can be traced through a letter grid (up/down/left/right, no cell reuse) and show the route for each word.
React + TypeScript + Vite. No backend. Search = Trie + DFS + backtracking.

## Run it
```bash
npm install
npm run dev      # open the printed URL (usually http://localhost:5173)
npm test         # algorithm tests: official example, edge cases, 10x10 + 10,000 words
npm run build    # type-check + production build
```

## Structure
```
src/
  algorithm/  types.ts  Trie.ts  findWords.ts  input.ts  benchmark.ts  findWords.test.ts
  components/ LetterGrid.tsx  DictionaryInput.tsx  ResultsPanel.tsx
  App.tsx  presets.ts  main.tsx  styles.css
```
All search logic lives in `src/algorithm/`. Components only call `findWords(grid, dictionary)`.

## 60-second explanation
We build a Trie from the dictionary so common prefixes are shared. DFS runs from every cell, following only valid Trie prefixes. A visited matrix prevents cell reuse and backtracking restores cells when a route finishes. When a complete word is found we store its path once (and keep searching deeper for longer words). Clicking a word shows its exact route on the grid.
