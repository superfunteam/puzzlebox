import { PuzzleboxClient } from '@puzzlebox/sdk';

async function main() {
  const baseUrl = process.env.PUZZLEBOX_BASE_URL ?? 'http://localhost:3000';
  const tenant = process.env.PUZZLEBOX_TENANT ?? 'demo';
  const apiKey = process.env.PUZZLEBOX_API_KEY ?? 'dev-admin-key';

  const client = new PuzzleboxClient({ baseUrl, tenant, apiKey });

  await client.createGame({
    name: 'Who Says?',
    slug: 'who-says',
    mode: 'pick_one',
    config: {
      rounds_per_edition: 5,
      partial_credit: true,
      share_emoji_correct: '🟩',
      share_emoji_incorrect: '🟥',
      share_emoji_game: '🎙️',
      share_url_template: 'https://play.twts.org/{slug}',
      allow_anonymous: true
    }
  });

  console.log('Seed game created');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
