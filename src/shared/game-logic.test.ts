import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateScore,
  getDailyPattern,
  TARGET_COUNT,
  TOTAL_CELLS,
} from './game-logic.ts';

describe('getDailyPattern', () => {
  it('always returns six unique valid cells', () => {
    const pattern = getDailyPattern('2026-11-19');

    assert.equal(pattern.length, TARGET_COUNT);
    assert.equal(new Set(pattern).size, TARGET_COUNT);

    for (const cell of pattern) {
      assert.ok(cell >= 0 && cell < TOTAL_CELLS);
    }
  });

  it('returns the same pattern for the same date', () => {
    assert.deepEqual(
      getDailyPattern('2026-11-19'),
      getDailyPattern('2026-11-19')
    );
  });

  it('changes the pattern for a different date', () => {
    assert.notDeepEqual(
      getDailyPattern('2026-11-19'),
      getDailyPattern('2026-11-20')
    );
  });
});

describe('calculateScore', () => {
  const pattern = [0, 2, 4, 6, 8, 10];

  it('awards 100% for six correct answers', () => {
    assert.deepEqual(
      calculateScore(pattern, pattern),
      { score: 100, correct: 6, wrong: 0, missed: 0 }
    );
  });

  it('calculates partial accuracy correctly', () => {
    assert.deepEqual(
      calculateScore([0, 2, 4, 12, 14, 15], pattern),
      { score: 50, correct: 3, wrong: 3, missed: 3 }
    );
  });

  it('awards zero for no correct answers', () => {
    assert.deepEqual(
      calculateScore([1, 3, 5, 7, 9, 11], pattern),
      { score: 0, correct: 0, wrong: 6, missed: 6 }
    );
  });
});
