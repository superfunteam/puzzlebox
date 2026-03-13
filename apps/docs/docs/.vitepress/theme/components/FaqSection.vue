<template>
  <section class="faq-section">
    <p class="faq-kicker">FAQ</p>
    <h2>Questions newsroom teams ask before launch.</h2>

    <div class="faq-grid">
      <article class="faq-item">
        <h3>How much of a game do we still need to build ourselves?</h3>
        <p>
          You build the front-end experience and game-specific interaction design. Puzzlebox provides the platform layer:
          tenant scoping, daily scheduling, answer validation, sessions, streaks, share payloads, and analytics endpoints.
          This keeps your team focused on editorial mechanics and presentation instead of repeating backend plumbing.
        </p>
      </article>

      <article class="faq-item">
        <h3>Can we run this in our own infrastructure?</h3>
        <p>
          Yes. The repo is designed for self-hosting and local development via Docker Compose, and can be deployed as a
          standard Node service with Postgres. Hosted deployment patterns are also documented for teams that want a managed
          operational model.
        </p>
      </article>

      <article class="faq-item">
        <h3>How does multi-tenant isolation actually work?</h3>
        <p>
          Requests resolve a tenant from context, and all game/player/session/analytics operations are tenant-scoped.
          Auth checks and data access are enforced per tenant boundary so one newsroom cannot read or mutate another
          newsroom’s data.
        </p>
      </article>

      <article class="faq-item">
        <h3>Does this support anonymous play and authenticated users together?</h3>
        <p>
          Yes. You can start users in anonymous mode for low-friction first play, then issue authenticated tokens later
          and merge account history. This enables growth-focused onboarding while still preserving streak and session data.
        </p>
      </article>

      <article class="faq-item">
        <h3>How quickly can editorial teams publish daily editions?</h3>
        <p>
          Editions can be published directly through API payloads or through the Sheets sync workflow. The typical flow is:
          prepare rounds, validate in staging, schedule publish time, and let the platform activate editions automatically.
        </p>
      </article>

      <article class="faq-item">
        <h3>What analytics are available out of the box?</h3>
        <p>
          Puzzlebox exposes tenant-level, game-level, and edition-level analytics including completion rates, per-round
          accuracy, session volumes, and streak-related metrics. These outputs are intended to connect directly to audience
          and retention reporting pipelines.
        </p>
      </article>

      <article class="faq-item">
        <h3>Is this API suitable for coding-agent workflows?</h3>
        <p>
          Yes. The project is contract-first with OpenAPI and consistent schemas, so coding agents can reliably generate
          integrations, tests, and endpoint clients while staying aligned with the published interface.
        </p>
      </article>
    </div>
  </section>
</template>
