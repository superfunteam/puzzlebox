<template>
  <div class="agent-flow">
    <div class="agent-step-grid">
      <article class="agent-step">
        <p class="agent-flow-kicker">Step 1</p>
        <h3>Pick the closest mode.</h3>
        <p>
          Use <code>pick_one</code> for discrete answer selection, <code>ordered_sequence</code> for sequence logic,
          and <code>survey</code> when the answer is the crowd.
        </p>
      </article>
      <article class="agent-step">
        <p class="agent-flow-kicker">Step 2</p>
        <h3>Model one edition cleanly.</h3>
        <p>Define one day’s worth of rounds, reveal metadata, and share rules before touching UI.</p>
      </article>
      <article class="agent-step">
        <p class="agent-flow-kicker">Step 3</p>
        <h3>Build the loop, not new primitives.</h3>
        <p>
          Create the game, publish an edition, fetch
          <code>/games/&#123;slug&#125;/today</code>, start or resume a session, respond, and complete.
        </p>
      </article>
    </div>

    <div class="agent-prompt-card">
      <p class="agent-flow-kicker">Starter Prompt</p>
      <pre>Read /agent-quickstart and /game-spec-template first.

Use Puzzlebox primitives only unless the spec clearly requires a new backend primitive.

I want a daily game called "[game name]".
Core idea: [one paragraph]
Target mode: [pick_one | ordered_sequence | survey | choose for me]
Audience + tone: [one paragraph]
Round structure: [what one round looks like]
Reveal payload: [what the player should learn after answering]
Frontend constraints: [embed, mobile, share UI, accessibility, branding]

Build:
1. the game setup/admin flow,
2. a playable frontend,
3. tests for the happy path,
4. concise docs for the next agent.</pre>
    </div>
  </div>
</template>
