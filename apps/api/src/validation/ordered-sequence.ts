import type { Round } from '@puzzlebox/shared';
import { scoreOrderedSequence } from '../services/scoring';

export function validateOrderedSequence(round: Round, answer: Record<string, unknown>, partialCredit: boolean) {
  const order = Array.isArray(answer.order) ? answer.order.map((value) => String(value)) : [];
  if (order.length === 0) {
    throw new Error('invalid_order');
  }

  const optionKeys = round.options.map((option) => option.key);
  const optionKeySet = new Set(optionKeys);

  if (order.length !== optionKeys.length) {
    throw new Error('invalid_order');
  }

  if (new Set(order).size !== order.length) {
    throw new Error('invalid_order');
  }

  if (!order.every((key) => optionKeySet.has(key))) {
    throw new Error('invalid_order');
  }

  const correct = round.correctAnswer as { order?: string[] } | null;
  const correctOrder = Array.isArray(correct?.order) ? correct.order.map((value) => String(value)) : null;
  if (!correctOrder?.length) {
    throw new Error('missing_correct_answer');
  }

  if (correctOrder.length !== optionKeys.length) {
    throw new Error('missing_correct_answer');
  }

  if (new Set(correctOrder).size !== correctOrder.length) {
    throw new Error('missing_correct_answer');
  }

  if (!correctOrder.every((key) => optionKeySet.has(key))) {
    throw new Error('missing_correct_answer');
  }

  return scoreOrderedSequence({ order }, { order: correctOrder }, partialCredit);
}
