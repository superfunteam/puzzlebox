# Hosted Tier Onboarding

## Provisioning checklist
1. Create tenant record with slug, name, timezone.
2. Generate tenant API key and store hashed secret.
3. Configure auth mode (`magic_link`, `oauth`, `external`).
4. Validate isolation with cross-tenant auth tests.
5. Share API base URL and docs link.

## Required legal docs
- DPA template: `docs/templates/dpa-template.md`
