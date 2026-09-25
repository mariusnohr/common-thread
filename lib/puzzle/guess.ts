/** True when `a` and `b` contain exactly the same words, in any order. */
export function sameWordSet(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((word) => set.has(word));
}

/** How many words of `guess` are also in `group`. */
export function sharedWordCount(
  group: readonly string[],
  guess: readonly string[],
): number {
  const set = new Set(group);
  return guess.filter((word) => set.has(word)).length;
}

/**
 * True when a wrong four-word guess has three words from one group, so the
 * player can be told they are one word away.
 */
export function isOneAway(
  groups: readonly { words: readonly string[] }[],
  guess: readonly string[],
): boolean {
  return groups.some(
    (group) => sharedWordCount(group.words, guess) === guess.length - 1,
  );
}
