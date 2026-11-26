export type Preset = { name: string; grid: string[][]; words: string[] };

const g = (...rows: string[]) => rows.map((r) => r.split(""));

export const PRESETS: Preset[] = [
  {
    name: "Official example",
    grid: g("oaan", "etae", "ihkr", "iflv"),
    words: ["oath", "pea", "eat", "rain"],
  },
  {
    name: "Shared prefixes",
    grid: g("stare", "qwxtz", "level"),
    words: ["star", "stare", "start", "tart", "tare", "level", "sea", "tea", "stats"],
  },
  {
    name: "Overlap and repeats",
    grid: g("abca", "xdex", "fgha"),
    words: ["abc", "bcd", "cba", "aba", "dee", "bed", "cab", "adg", "gdb"],
  },
];
