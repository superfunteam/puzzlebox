export interface ScoringResult {
  isCorrect: boolean | null;
  score: number;
  positionsCorrect?: boolean[];
}

export function scorePickOne(answer: { key: string }, correct: { key: string }): ScoringResult {
  const isCorrect = answer.key === correct.key;
  return {
    isCorrect,
    score: isCorrect ? 1 : 0
  };
}

export function scoreOrderedSequence(
  answer: { order: string[] },
  correct: { order: string[] },
  partialCredit: boolean
): ScoringResult {
  const positionsCorrect = answer.order.map((value, index) => value === correct.order[index]);
  const correctCount = positionsCorrect.filter(Boolean).length;
  const isCorrect = correctCount === correct.order.length;
  return {
    isCorrect,
    score: partialCredit ? correctCount : isCorrect ? 1 : 0,
    positionsCorrect
  };
}

export function scoreSurvey(): ScoringResult {
  return {
    isCorrect: null,
    score: 1
  };
}
