import type { Round } from '@puzzlebox/shared';
import { scorePickOne } from '../services/scoring';

export function validatePickOne(round: Round, answer: Record<string, unknown>) {
  const key = String(answer.key ?? '');
  const correct = round.correctAnswer as { key?: string } | null;
  if (!correct?.key) {
    throw new Error('missing_correct_answer');
  }

  const optionExists = round.options.some((option) => option.key === key);
  if (!optionExists) {
    throw new Error('invalid_option');
  }

  return scorePickOne({ key }, { key: correct.key });
}
