/** Indices of alphabetic characters in display order (left to right). */
export function getRevealableLetterIndices(name: string): number[] {
  const indices: number[] = [];
  for (let i = 0; i < name.length; i++) {
    if (/[A-Za-z]/.test(name[i]!)) indices.push(i);
  }
  return indices;
}

export function countRevealableLetters(name: string): number {
  return getRevealableLetterIndices(name).length;
}

/** Mask unrevealed letters with underscores; spaces and punctuation stay visible. */
export function buildTypeHintDisplay(name: string, revealedCount: number): string {
  const indices = getRevealableLetterIndices(name);
  const revealed = new Set(indices.slice(0, Math.max(0, revealedCount)));
  let out = "";
  for (let i = 0; i < name.length; i++) {
    const ch = name[i]!;
    out += /[A-Za-z]/.test(ch) ? (revealed.has(i) ? ch : "_") : ch;
  }
  return out;
}
