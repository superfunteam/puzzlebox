# Sheets Sync

Reference ingestion tool for editorial workflows.

Input is a JSON array exported from spreadsheet rows and transformed into the `POST /games/:slug/editions` payload.

## Usage

```bash
npm run sync -w @puzzlebox/sheets-sync -- \
  http://localhost:3000 \
  demo \
  dev-admin-key \
  who-says \
  pick_one \
  ./rows.json
```
