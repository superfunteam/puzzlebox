# Game Spec Template

Use this template before asking an agent to build a new Puzzlebox game. If a section is blank, the agent will guess, and the result will drift.

## 1. Identity

- Game name:
- Slug:
- One-sentence pitch:
- Audience:
- Tone:

## 2. Core Mode

- Puzzlebox mode: `pick_one` | `ordered_sequence` | `survey`
- Why this mode fits:
- Rounds per edition:
- Should anonymous play be allowed: yes/no

## 3. What One Round Looks Like

- Prompt shape:
- Option count:
- How the player answers:
- What counts as correct:
- Whether partial credit matters:

## 4. Reveal Payload

After an answer, what should the player learn?

- Correct/incorrect reveal copy:
- Explanation or fun fact:
- Metadata the frontend needs:
- Whether the reveal links out to source/editorial content:

## 5. Daily Edition Shape

- How many rounds per day:
- Whether round difficulty escalates:
- Whether one edition has a theme:
- How editors create tomorrow’s edition:

## 6. Share + Streak Expectations

- Share emoji for correct:
- Share emoji for incorrect:
- Share emoji for game:
- Desired share text tone:
- Share destination URL pattern:
- Any streak copy requirements:

## 7. Frontend Constraints

- Where the game lives: standalone page / embed / app surface
- Brand constraints:
- Mobile constraints:
- Accessibility constraints:
- Motion/audio constraints:

## 8. Editorial + Ops Constraints

- Who publishes editions:
- Where source content lives:
- Whether Sheets sync is needed:
- Whether editions can be scheduled in advance:
- Required analytics/KPIs:

## 9. Acceptance Criteria

- A playable flow is complete when:
- The agent must include these tests:
- The docs must explain:

## 10. Open Questions

- Unknowns the agent is allowed to decide:
- Unknowns that require human confirmation:

## Good Enough To Build

The spec is ready when an agent can answer these with no extra guessing:

- Which Puzzlebox mode is the game using?
- What does one edition contain?
- What does one round validate?
- What should the reveal payload contain?
- What should the completion/share screen show?
- How does editorial create the next edition?
