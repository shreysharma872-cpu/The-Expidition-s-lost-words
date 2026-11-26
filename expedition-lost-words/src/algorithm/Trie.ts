export class TrieNode {
  children: Map<string, TrieNode> = new Map();
  word: string | null = null; // set when a dictionary word ends here
}

export class Trie {
  root = new TrieNode();

  insert(word: string): void {
    let node = this.root;
    for (const ch of word) {
      let next = node.children.get(ch);
      if (!next) {
        next = new TrieNode();
        node.children.set(ch, next);
      }
      node = next;
    }
    node.word = word;
  }
}
