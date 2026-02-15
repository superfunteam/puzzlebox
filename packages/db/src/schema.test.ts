import { describe, expect, it } from 'vitest';
import { gameModeEnum } from './schema/games';

describe('db schema', () => {
  it('includes v1 game modes', () => {
    expect(gameModeEnum.enumValues).toEqual(['pick_one', 'ordered_sequence', 'survey']);
  });
});
