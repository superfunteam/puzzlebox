import type { Round } from '@puzzlebox/shared';
import { scoreOrderedSequence } from '../services/scoring';

export function validateOrderedSequence(round: Round, answer: Record<string, unknown>, partialCredit: boolean) {
  const order = Array.isArray(answer.order) ? answer.order.map((value) => String(value)) : [];
  const correct = round.correctAnswer as { order?: string[] } | null;
  if (!correct?.order?.length) {
    throw new Error('missing_correct_answer');
  }

  return scoreOrderedSequence({ order }, { order: correct.order }, partialCredit);
}
