import type { PlayerStreak, Player, Tenant } from '@puzzlebox/shared';
import { dateInTimezone } from '../lib/time';

function previousDate(dateIso: string): string {
  const date = new Date(`${dateIso}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function applyGraceDate(now: Date, timezone: string, graceHours: number): string {
  const localDate = dateInTimezone(now, timezone);
  const midnightUtc = new Date(`${localDate}T00:00:00.000Z`);
  const graceLimitUtc = new Date(midnightUtc.valueOf() + graceHours * 60 * 60 * 1000);
  if (now.valueOf() <= graceLimitUtc.valueOf()) {
    return previousDate(localDate);
  }
  return localDate;
}

export function updateStreak(input: {
  streak: PlayerStreak;
  player: Player;
  tenant: Tenant;
  now?: Date;
  graceHours: number;
}): PlayerStreak {
  const now = input.now ?? new Date();
  const zone = input.player.timezone ?? input.tenant.timezone;
  const playDate = applyGraceDate(now, zone, input.graceHours);

  const current = { ...input.streak };

  if (!current.lastPlayedDate) {
    current.currentStreak = 1;
    current.longestStreak = Math.max(current.longestStreak, current.currentStreak);
    current.lastPlayedDate = playDate;
    current.updatedAt = now.toISOString();
    return current;
  }

  if (current.lastPlayedDate === playDate) {
    current.updatedAt = now.toISOString();
    return current;
  }

  const yesterday = previousDate(playDate);

  if (current.lastPlayedDate === yesterday) {
    current.currentStreak += 1;
    current.longestStreak = Math.max(current.longestStreak, current.currentStreak);
    current.lastPlayedDate = playDate;
    current.updatedAt = now.toISOString();
    return current;
  }

  if (current.freezesRemaining > 0) {
    current.freezesRemaining -= 1;
    current.lastPlayedDate = playDate;
    current.updatedAt = now.toISOString();
    return current;
  }

  current.currentStreak = 1;
  current.longestStreak = Math.max(current.longestStreak, current.currentStreak);
  current.lastPlayedDate = playDate;
  current.updatedAt = now.toISOString();
  return current;
}
