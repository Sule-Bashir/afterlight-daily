export const TOTAL_CELLS = 16;
export const TARGET_COUNT = 6;

export function getDailyPattern(date: string): number[] {
  let seed = 0;

  for (const char of date) {
    seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
  }

  const values = Array.from(
    { length: TOTAL_CELLS },
    (_, index) => index
  );

  for (let i = values.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    const temp = values[i]!;
    values[i] = values[j]!;
    values[j] = temp;
  }

  return values.slice(0, TARGET_COUNT);
}

export function calculateScore(
  selected: number[],
  pattern: number[]
) {
  const correct = selected.filter(
    cell => pattern.includes(cell)
  ).length;

  const wrong = selected.length - correct;
  const missed = TARGET_COUNT - correct;
  const score = Math.round((correct / TARGET_COUNT) * 100);

  return { score, correct, wrong, missed };
}
