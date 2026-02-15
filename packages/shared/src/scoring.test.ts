import { describe, expect, it } from 'vitest';
import { gameConfigSchema } from './schemas';

describe('shared schemas', () => {
  it('defaults game config fields', () => {
    const parsed = gameConfigSchema.parse({
      shareUrlTemplate: 'https://example.com/game'
    });

    expect(parsed.roundsPerEdition).toBe(5);
    expect(parsed.partialCredit).toBe(true);
    expect(parsed.allowAnonymous).toBe(true);
  });
});
