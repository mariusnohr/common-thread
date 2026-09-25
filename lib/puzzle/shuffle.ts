/**
 * Deterministic shuffle so the word order is stable across reloads and
 * server/client renders (avoiding hydration mismatches). The seed is the
 * puzzle's publish date.
 */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Deterministic shuffle for a known seed. Used for tests and for callers that
 * explicitly want a stable order.
 */
export function shuffleWords(words: string[], seed: string): string[] {
  const result = [...words];
  const random = mulberry32(seedFromString(seed));
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * An unpredictable per-request seed. The daily page uses this so the order in
 * the RSC payload cannot be reversed to recover the hidden groups.
 */
export function randomSeed(): string {
  return crypto.randomUUID();
}
