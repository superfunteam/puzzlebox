# Heatmap Playtest Agent Handoff

## Purpose
Build a playable Heatmap prototype inside Puzzlebox that validates one thing fast: is "read clue -> click map under time pressure" fun enough to justify full production work.

This is a playtest build, not a full platform launch.

## Source Brief
Primary content brief:
- `/Users/clark/Downloads/Source/puzzlebox-heatmap/Heatmap-Playtest-Brief.md`

## Product Intent (What Must Feel True)
- Warm, curious tone. Never condescending.
- Hints are learning content, not punishment.
- Pace is fast and slightly tense (15-second countdown).
- Reveal should feel rewarding even after timeout.

## Scope
In scope:
- 5 rounds per session.
- 1 phrase per round.
- US dot map interaction (click to choose location).
- 15-second timer per round.
- Hint 1 appears at 11s remaining.
- Hint 2 appears at 7s remaining.
- Submit on click OR on timeout.
- Reveal target location + one-line explanation.
- Time-based score per round and running total.
- Session summary after round 5.

Out of scope:
- Daily rotation/scheduling.
- Accounts, streaks, sharing, backend persistence.
- Distance-based scoring.
- Advanced heat overlays/animations.
- Analytics dashboards.

## Build Strategy in Puzzlebox
Recommended path: frontend-only playtest module in `@puzzlebox/web`.

Rationale:
- Fastest route to mechanic validation.
- Current backend scoring is integer-based (`responses.score`, `sessions.score`), while Heatmap wants decimal time-based scoring.
- Playtest brief explicitly says backend is not required.

Relevant reference files:
- `/Users/clark/Downloads/Source/puzzlebox/apps/web/src/App.tsx`
- `/Users/clark/Downloads/Source/puzzlebox/apps/web/src/hooks/useWhoSays.ts`
- `/Users/clark/Downloads/Source/puzzlebox/packages/shared/src/constants.ts`
- `/Users/clark/Downloads/Source/puzzlebox/apps/api/src/routes/sessions/sessions.handlers.ts`

## Core Loop Contract
For each round:
1. Show term/phrase and a US dot map.
2. Start timer at `15.0` seconds.
3. Auto-reveal hint 1 when remaining time `<= 11.0`.
4. Auto-reveal hint 2 when remaining time `<= 7.0`.
5. On player click:
   - Lock round immediately.
   - Compute score from remaining time.
   - Show reveal state.
6. On timeout (no click by 0):
   - Lock round.
   - Score = `0.0`.
   - Show reveal state.
7. Continue to next round until 5 rounds complete.

## Scoring Contract
Per-round score:
- `round_score = round_to_1_decimal(seconds_remaining / 15)`
- Clamp to `[0.0, 1.0]`
- Timeout always yields `0.0`

Session score:
- `session_score = sum(round_score for 5 rounds)`
- Display with 1 decimal (max `5.0`)

Important:
- Do not include distance in scoring for this playtest.

## US Dot Map Interaction Spec
### Map model
- Render a US-only map panel with a visible field of dots.
- Dot set should be static and deterministic (same coordinates every run).
- Keep visual style lightweight and legible on laptop/mobile.

### Click resolution
- On click, resolve to nearest available dot id.
- Persist `selected_dot_id`, plus its coordinates.
- A click always counts as a submission.

### Reveal visuals
Reveal should show at minimum:
- Selected dot (if user clicked).
- Correct target dot.
- One-line explanation text.
- Optional line/beam between selected and target for clarity.

## Content Model (Playtest Fixture)
Use one local fixture file for now.

```json
{
  "id": "heatmap-round-1",
  "term": "All hat, no cattle",
  "target": {
    "dot_id": "us-tx-austin",
    "label": "Austin, Texas",
    "lat": 30.27,
    "lng": -97.74
  },
  "hints": [
    {
      "reveal_at_seconds_remaining": 11,
      "text": "This expression is from the 1930s and describes someone who is all boastful talk but nothing behind it."
    },
    {
      "reveal_at_seconds_remaining": 7,
      "text": "Think big ranches, big hats, and big talkers."
    }
  ],
  "reveal": "A North American expression for empty bravado.",
  "source": "TWTS Dec 21, 2025"
}
```

### Content note
Your brief includes non-US targets (for example Northern England/UK). This handoff assumes a US-only map.

Action for content prep:
- Replace non-US rounds with US-local slang rounds before final playtest package.
- Keep hint structure and reveal tone exactly as in brief.

## Frontend State Machine
States:
- `loading`
- `in_round`
- `round_locked`
- `revealed`
- `next_round`
- `session_complete`

Transitions:
- `loading -> in_round`
- `in_round -> round_locked` on click or timeout
- `round_locked -> revealed` after scoring/reveal payload prepared
- `revealed -> next_round` on continue action
- `next_round -> in_round` if rounds remain
- `revealed -> session_complete` after round 5

Guards:
- Ignore map clicks outside `in_round`.
- Ignore double-click submits after first lock.
- Timer must stop immediately on lock.

## Suggested File Plan
Create a focused feature folder in web app:
- `/Users/clark/Downloads/Source/puzzlebox/apps/web/src/features/heatmap/fixtures/heatmap-rounds.ts`
- `/Users/clark/Downloads/Source/puzzlebox/apps/web/src/features/heatmap/fixtures/us-dots.ts`
- `/Users/clark/Downloads/Source/puzzlebox/apps/web/src/features/heatmap/engine.ts`
- `/Users/clark/Downloads/Source/puzzlebox/apps/web/src/features/heatmap/types.ts`
- `/Users/clark/Downloads/Source/puzzlebox/apps/web/src/features/heatmap/components/HeatmapMap.tsx`
- `/Users/clark/Downloads/Source/puzzlebox/apps/web/src/features/heatmap/components/HeatmapHUD.tsx`
- `/Users/clark/Downloads/Source/puzzlebox/apps/web/src/features/heatmap/components/RoundReveal.tsx`
- `/Users/clark/Downloads/Source/puzzlebox/apps/web/src/features/heatmap/useHeatmapGame.ts`

Then mount in app entry:
- `/Users/clark/Downloads/Source/puzzlebox/apps/web/src/App.tsx`

## Engine Requirements
Keep `engine.ts` pure and testable.

Functions to implement:
- `computeRoundScore(secondsRemaining: number): number`
- `getHintVisibility(secondsRemaining: number): { hint1: boolean; hint2: boolean }`
- `resolveNearestDot(click: {x:number,y:number}, dots: Dot[]): Dot`
- `buildReveal(round, selectedDot): RevealPayload`
- `accumulateSessionScore(roundScores: number[]): number`

## Timer Behavior Details
- Timer resolution: 100ms (UI), scoring based on continuous value at lock time.
- If timer is exactly `0`, treat as timeout.
- Hint thresholds are inclusive (`<= 11`, `<= 7`).
- Hints remain visible once revealed.

## UX Requirements
- Keep important info above fold on 13-inch laptop.
- Round header should always show:
  - round index (`2/5`)
  - remaining time
  - running score
- Reveal card should include:
  - term
  - correct location
  - selected location (or "No guess")
  - one-line explanation

## Testing Checklist
Add unit tests for engine behavior:
- `/Users/clark/Downloads/Source/puzzlebox/apps/web/src/features/heatmap/engine.test.ts`

Must test:
- Score function boundaries (`15 -> 1.0`, `0 -> 0.0`, midpoint rounding).
- Hint reveal thresholds at `11.0` and `7.0`.
- Timeout path returns `0.0` and no selection.
- Double-submit guard.
- Session total after 5 rounds.

Manual QA:
- Complete all 5 rounds without refresh.
- Click very late (for example `0.2s`) and confirm non-negative score.
- Let timer expire on at least one round.
- Validate mobile width (<= 390px) remains usable.

## Acceptance Criteria
- A player can complete all 5 rounds in one uninterrupted run.
- Timer, hints, and lock behavior are deterministic and consistent.
- Score is time-based only and displayed correctly to 1 decimal.
- Each reveal teaches a linguistic fact even when score is low.
- Build runs with existing web scripts and no backend dependency.

## Optional Phase 2 (Not Required for Playtest)
If later integrating with API sessions:
- Add a dedicated Heatmap mode with decimal scoring support OR store tenths as integer.
- Extend `respond` contract to carry `elapsed_ms` and map payload.
- Update backend score schema/aggregation accordingly.

Do not block playtest delivery on phase 2.
