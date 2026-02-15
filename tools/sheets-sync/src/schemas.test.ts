import { describe, expect, it } from 'vitest';
import { orderedRowsToEditionPayload, pickOneRowsToEditionPayload, surveyRowsToEditionPayload } from './schemas';

describe('sheets transform', () => {
  it('transforms pick_one rows', () => {
    const payload = pickOneRowsToEditionPayload([
      {
        edition_date: '2026-02-15',
        position: '1',
        prompt: 'Who says?',
        option_a: 'Anne',
        option_b: 'Rebecca',
        correct: 'a'
      }
    ]);

    expect(payload.rounds[0]?.correct_answer).toEqual({ key: 'a' });
  });

  it('transforms ordered rows', () => {
    const payload = orderedRowsToEditionPayload([
      {
        edition_date: '2026-02-15',
        position: '1',
        prompt: 'Order words',
        item_1_label: 'one',
        item_1_sort: '1',
        item_2_label: 'two',
        item_2_sort: '2',
        item_3_label: 'three',
        item_3_sort: '3'
      }
    ]);

    expect(payload.rounds[0]?.correct_answer).toEqual({ order: ['a', 'b', 'c'] });
  });

  it('transforms survey rows', () => {
    const payload = surveyRowsToEditionPayload([
      {
        edition_date: '2026-02-15',
        position: '1',
        prompt: 'What do you say?',
        option_a: 'Tin foil',
        option_b: 'Aluminum foil'
      }
    ]);

    expect(payload.rounds[0]?.correct_answer).toBeNull();
  });
});
