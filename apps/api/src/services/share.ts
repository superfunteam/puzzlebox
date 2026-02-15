import type { Game } from '@puzzlebox/shared';

export function buildShareData(input: {
  game: Game;
  editionDate: string;
  score: number;
  maxScore: number;
  streak: number;
  perRound: Array<boolean | null>;
}) {
  const emojiGrid = input.perRound
    .map((value) => {
      if (value === null) return '⬜';
      return value ? input.game.config.shareEmojiCorrect : input.game.config.shareEmojiIncorrect;
    })
    .join('');

  const url = input.game.config.shareUrlTemplate.replace('{slug}', input.game.slug);
  const shareText = `${input.game.name} ${input.game.config.shareEmojiGame} ${input.score}/${input.maxScore}\n${emojiGrid}\n🔥 ${input.streak}-day streak\n${url}`;

  return {
    game_name: input.game.name,
    game_emoji: input.game.config.shareEmojiGame,
    edition_date: input.editionDate,
    score: input.score,
    max_score: input.maxScore,
    streak: input.streak,
    per_round: input.perRound,
    share_text: shareText
  };
}
