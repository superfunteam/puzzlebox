import type { Round } from '@puzzlebox/shared';
import { scoreSurvey } from '../services/scoring';

export function validateSurvey(round: Round, answer: Record<string, unknown>) {
  const key = String(answer.key ?? '');
  const optionExists = round.options.some((option) => option.key === key);
  if (!optionExists) {
    throw new Error('invalid_option');
  }

  return scoreSurvey();
}
