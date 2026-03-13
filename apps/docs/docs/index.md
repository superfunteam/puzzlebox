---
layout: home

hero:
  name: ""
  text: ""
  tagline: "Describe the game. Let an agent ship the backend loop. Puzzlebox gives daily-game primitives for scheduling, validation, sessions, streaks, sharing, and analytics."
  actions:
    - theme: brand
      text: Agent Quickstart
      link: /agent-quickstart
    - theme: alt
      text: 10-Minute Quickstart
      link: /quickstart
    - theme: alt
      text: API Overview
      link: /api/overview

features:
  - title: Explicit Primitives
    details: Tenants, games, editions, rounds, sessions, and responses are first-class objects with predictable behavior.
  - title: Agent-Readable Contract
    details: The SDK, docs, and OpenAPI surface use consistent snake_case JSON so generated clients can reason about the API directly.
  - title: Built For Daily Ops
    details: Publish editions, enforce playability rules, resume sessions safely, and inspect analytics without inventing backend glue.
---

<div class="marketing-grid">
  <div class="marketing-card">
    <strong>What Puzzlebox Is</strong>
    <p>A framework for daily-play game infrastructure. You bring the game concept and frontend UX. Puzzlebox handles the operational backend layer.</p>
  </div>
  <div class="marketing-card">
    <strong>What An Agent Needs</strong>
    <p>A mode decision, a daily edition shape, a round template, and the desired reveal/share behavior. The rest should map onto Puzzlebox primitives.</p>
  </div>
  <div class="marketing-card">
    <strong>What “Done” Looks Like</strong>
    <p>A playable frontend, an admin/content path to create editions, tests for the gameplay loop, and docs another agent can continue from.</p>
  </div>
</div>

<AgentWorkflowSection />

## Hand These Docs To A New Agent

- [/agent-quickstart](/agent-quickstart): the condensed operating model, constraints, and copy-paste prompt.
- [/game-spec-template](/game-spec-template): the minimum information an agent needs to build a working game.
- [/quickstart](/quickstart): local boot instructions and the first API flow.
- [/sdk](/sdk): typed client methods and error handling.

## Choose The Right Mode

| If the player is doing this | Use this Puzzlebox mode | Backend behavior you get |
|---|---|---|
| Picking one answer from a set | `pick_one` | Correct answer validation, one point per round, reveal payload support |
| Ordering items into a sequence | `ordered_sequence` | Per-position correctness, partial credit, max score derived from sequence length |
| Sharing an opinion or preference | `survey` | Participation scoring and crowd distribution responses |

<InsideBoxSection />

<FaqSection />

<footer class="docs-footer">
  <div class="footer-grid">
    <div>
      <h3>Puzzlebox</h3>
      <p>Agent-first backend primitives for daily-play newsroom game operations.</p>
    </div>
    <div>
      <h4>Agent Docs</h4>
      <ul>
        <li><a href="/agent-quickstart">Agent Quickstart</a></li>
        <li><a href="/game-spec-template">Game Spec Template</a></li>
        <li><a href="/quickstart">10-Minute Quickstart</a></li>
      </ul>
    </div>
    <div>
      <h4>Platform</h4>
      <ul>
        <li><a href="/api/overview">API Overview</a></li>
        <li><a href="/architecture">Architecture</a></li>
        <li><a href="/sdk">SDK</a></li>
      </ul>
    </div>
  </div>
  <p class="footer-meta">© Puzzlebox. Built for newsroom teams that want reusable game infrastructure.</p>
</footer>
