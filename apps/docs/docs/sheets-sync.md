# Sheets Sync Tool

`@puzzlebox/sheets-sync` converts spreadsheet-exported rows into edition payloads and publishes them via API.

## What it supports

- `pick_one`
- `ordered_sequence`
- `survey`

## Input format

Provide rows as JSON array exported from your editorial sheet.

## Run

```bash
npm run sync -w @puzzlebox/sheets-sync -- \
  http://localhost:3000 \
  demo \
  dev-admin-key \
  who-says \
  pick_one \
  ./rows.json
```

Arguments:

1. Base URL
2. Tenant slug
3. API key
4. Game slug
5. Mode
6. Path to rows JSON file

## Workflow recommendation

1. Keep one sheet tab per mode.
2. Validate with a staging tenant first.
3. Promote successful edition payloads to production tenant.
