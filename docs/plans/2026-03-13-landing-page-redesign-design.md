# Landing Page Redesign: Confident Minimalism + Nav Switcher

## Goal
Restore the warm, confident, minimal vibes of commit a53de95 while keeping the clever human/agent audience switcher elevated to a first-class nav feature. Trim page sections to what matters. Keep the best current copy.

## Architecture

### Nav-Level Audience Toggle
- Human/Agent pill switcher in VitePress navbar (right-aligned, before social links)
- Vue `provide/inject` shares reactive audience state between nav component and page component
- Fixed nav means toggle is always accessible on scroll

### Page Sections (top to bottom)
1. **Hero** — ASCII Puzzlebox mark (dark terminal block) on warm gradient background. Audience-reactive tagline. Two CTAs.
2. **Signal strip** — 4 horizontal pills, swap per audience.
3. **Two-panel value prop** — 2 cards with eyebrow/title/body/bullets. Copy swaps per audience.
4. **Four-step game loop** — Horizontal step cards. Content swaps per audience.
5. **Code/walkthrough block** — Plain-language (human) or TypeScript SDK (agent).
6. **Footer** — Compact 3-column layout.

### What Gets Cut
- Guardrails section (belongs in docs)
- Resource grid (nav/sidebar covers this)
- Mode cards (belongs in game-spec-template page)

### Styling
- Warm gradient from a53de95: `linear-gradient(120deg, #f6f2d9 0%, #f4d6ad 50%, #dce6ff 100%)`
- Font stack: Space Grotesk (headlines), Manrope (body), IBM Plex Mono (code/UI)
- Fade-up entrance animations
- Refined color variables blending old warmth with current system

### Files to Modify
- `apps/docs/docs/.vitepress/theme/index.ts` — register nav toggle component, restore ASCII mark in hero slot
- `apps/docs/docs/.vitepress/theme/components/AudienceModeHome.vue` — rewrite: fewer sections, audience-reactive tagline, ASCII hero
- `apps/docs/docs/.vitepress/theme/components/NavAudienceToggle.vue` — new: pill switcher for navbar
- `apps/docs/docs/.vitepress/theme/custom.css` — rewrite: restore warm gradient, trim unused section styles
- `apps/docs/docs/.vitepress/config.ts` — no changes needed
- `apps/docs/docs/index.md` — simplify frontmatter (remove hero text/tagline, let component handle it)
