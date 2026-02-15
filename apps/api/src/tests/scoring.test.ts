import { describe, expect, it } from 'vitest';
import { scoreOrderedSequence, scorePickOne, scoreSurvey } from '../services/scoring';

describe('scoring service', () => {
  it('scores pick_one', () => {
    expect(scorePickOne({ key: 'a' }, { key: 'a' }).score).toBe(1);
    expect(scorePickOne({ key: 'b' }, { key: 'a' }).score).toBe(0);
  });

  it('scores ordered_sequence with partial credit', () => {
    const result = scoreOrderedSequence({ order: ['a', 'b', 'c'] }, { order: ['a', 'c', 'b'] }, true);
    expect(result.score).toBe(1);
    expect(result.positionsCorrect).toEqual([true, false, false]);
  });

  it('scores survey as participation', () => {
    expect(scoreSurvey()).toEqual({ isCorrect: null, score: 1 });
  });
});
