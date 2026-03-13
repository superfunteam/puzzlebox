# Hosted Tier Onboarding

## Provisioning checklist
1. Create tenant record with slug, name, timezone.
2. Generate tenant API key and store hashed secret.
3. Provision Postgres runtime (Supabase hosted/self-hosted or equivalent) and apply `packages/db` migrations.
4. Configure auth mode (`magic_link` or `external`) and anonymous access policy.
5. Validate isolation with cross-tenant auth tests.
6. Share API base URL and docs link.

## Required legal docs
- DPA template: `docs/templates/dpa-template.md`
