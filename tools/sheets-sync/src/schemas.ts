import type { CreateEditionRequest } from '@puzzlebox/sdk';

export interface PickOneRow {
  edition_date: string;
  position: string;
  prompt: string;
  option_a: string;
  option_b: string;
  option_c?: string;
  option_d?: string;
  correct: string;
  fun_fact?: string;
  episode_ref?: string;
}

export interface OrderedRow {
  edition_date: string;
  position: string;
  prompt: string;
  item_1_label: string;
  item_1_sort: string;
  item_2_label: string;
  item_2_sort: string;
  item_3_label: string;
  item_3_sort: string;
  item_4_label?: string;
  item_4_sort?: string;
}

export interface SurveyRow {
  edition_date: string;
  position: string;
  prompt: string;
  option_a: string;
  option_b: string;
  option_c?: string;
  option_d?: string;
}

export function pickOneRowsToEditionPayload(rows: PickOneRow[]): CreateEditionRequest {
  const firstRow = rows.at(0);
  if (!firstRow) throw new Error('no_rows');
  const editionDate = firstRow.edition_date;

  return {
    edition_date: editionDate,
    status: 'scheduled',
    publish_at: `${editionDate}T00:00:00.000Z`,
    metadata: null,
    rounds: rows
      .slice()
      .sort((a, b) => Number(a.position) - Number(b.position))
      .map((row) => ({
        position: Number(row.position),
        prompt: row.prompt,
        options: [
          { key: 'a', label: row.option_a },
          { key: 'b', label: row.option_b },
          ...(row.option_c ? [{ key: 'c', label: row.option_c }] : []),
          ...(row.option_d ? [{ key: 'd', label: row.option_d }] : [])
        ],
        correct_answer: { key: row.correct },
        metadata: {
          fun_fact: row.fun_fact ?? null,
          episode_ref: row.episode_ref ?? null
        }
      }))
  };
}

export function orderedRowsToEditionPayload(rows: OrderedRow[]): CreateEditionRequest {
  const firstRow = rows.at(0);
  if (!firstRow) throw new Error('no_rows');
  const editionDate = firstRow.edition_date;

  return {
    edition_date: editionDate,
    status: 'scheduled',
    publish_at: `${editionDate}T00:00:00.000Z`,
    metadata: null,
    rounds: rows
      .slice()
      .sort((a, b) => Number(a.position) - Number(b.position))
      .map((row) => {
        const items = [
          { label: row.item_1_label, sort: row.item_1_sort },
          { label: row.item_2_label, sort: row.item_2_sort },
          { label: row.item_3_label, sort: row.item_3_sort },
          ...(row.item_4_label && row.item_4_sort ? [{ label: row.item_4_label, sort: row.item_4_sort }] : [])
        ];

        const keyed = items.map((item, index) => ({ ...item, key: String.fromCharCode(97 + index) }));
        const ordered = keyed.slice().sort((a, b) => Number(a.sort) - Number(b.sort));

        return {
          position: Number(row.position),
          prompt: row.prompt,
          options: keyed.map((item) => ({ key: item.key, label: item.label })),
          correct_answer: { order: ordered.map((item) => item.key) },
          metadata: null
        };
      })
  };
}

export function surveyRowsToEditionPayload(rows: SurveyRow[]): CreateEditionRequest {
  const firstRow = rows.at(0);
  if (!firstRow) throw new Error('no_rows');
  const editionDate = firstRow.edition_date;

  return {
    edition_date: editionDate,
    status: 'scheduled',
    publish_at: `${editionDate}T00:00:00.000Z`,
    metadata: null,
    rounds: rows
      .slice()
      .sort((a, b) => Number(a.position) - Number(b.position))
      .map((row) => ({
        position: Number(row.position),
        prompt: row.prompt,
        options: [
          { key: 'a', label: row.option_a },
          { key: 'b', label: row.option_b },
          ...(row.option_c ? [{ key: 'c', label: row.option_c }] : []),
          ...(row.option_d ? [{ key: 'd', label: row.option_d }] : [])
        ],
        correct_answer: null,
        metadata: null
      }))
  };
}
