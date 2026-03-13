# Error Model

Puzzlebox returns JSON errors with a consistent `error` string.

## Typical Error Payload

```json
{
  "error": "invalid_token"
}
```

Validation failures include structured issues:

```json
{
  "error": "validation_error",
  "details": [
    { "path": ["edition_date"], "message": "Invalid format" }
  ]
}
```

## Common Errors

| Error | Meaning |
|---|---|
| `missing_tenant` | Missing `X-Tenant` header |
| `unknown_tenant` | Tenant slug not found |
| `missing_api_key` | Missing admin key |
| `invalid_api_key` | Key not valid for tenant |
| `missing_bearer_token` | Missing JWT bearer token |
| `invalid_token` | Invalid or expired JWT |
| `tenant_mismatch` | Token tenant does not match request tenant |
| `game_slug_exists` | Duplicate game slug inside the tenant |
| `edition_exists` | Duplicate `(game, edition_date)` edition |
| `round_count_mismatch` | Edition round count does not match game config |
| `invalid_correct_answer` | Round `correct_answer` shape does not match mode/options |
| `invalid_order` | Ordered-sequence answer does not include a valid full ordering |
| `session_exists` | Player already started that edition |
| `edition_not_playable` | Tried to start a session for a non-active edition |
| `session_incomplete` | Tried to complete before answering every round |
| `session_completed` | Tried to respond after session completion |
| `playtest_capacity_reached` | Playtest game reached the unique-player cap |

## HTTP Status Guidance

- `401`: missing or invalid authentication
- `403`: authenticated but not allowed for that tenant/object
- `404`: resource not found in tenant scope
- `409`: idempotency or state conflict
- `422`: semantic validation failure
- `429`: rate limiting

## Agent Guidance

Do not treat `session_exists` as a failure state for frontends. It is the server telling you to resume.
