/** Lowercase, strip accents/punctuation — for forgiving city name checks. */
export function normalizeCityName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[''`.-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const next = Math.min(row[j]! + 1, prev + 1, row[j - 1]! + cost);
      row[j - 1] = prev;
      prev = next;
    }
    row[b.length] = prev;
  }
  return row[b.length]!;
}

/** Generous match: exact, spacing-insensitive, or small edit distance. */
export function matchesCityName(input: string, target: string): boolean {
  const a = normalizeCityName(input);
  const b = normalizeCityName(target);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.replace(/\s/g, "") === b.replace(/\s/g, "")) return true;

  const maxDist = b.length <= 5 ? 1 : 2;
  return levenshtein(a, b) <= maxDist;
}
