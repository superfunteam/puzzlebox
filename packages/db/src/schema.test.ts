import { describe, expect, it } from 'vitest';
import { authMethodEnum } from './schema/players';
import { gameLifecycleEnum, gameModeEnum } from './schema/games';

describe('db schema', () => {
  it('includes v1 game modes', () => {
    expect(gameModeEnum.enumValues).toEqual(['pick_one', 'ordered_sequence', 'survey']);
  });

  it('includes game lifecycle values', () => {
    expect(gameLifecycleEnum.enumValues).toEqual(['playtest', 'production']);
  });

  it('matches supported auth methods in baseline', () => {
    expect(authMethodEnum.enumValues).toEqual(['magic_link', 'external', 'anonymous']);
  });
});
