# Error Model

Puzzlebox returns JSON errors with consistent semantics.

## Typical error payload

```json
{
  "error": "invalid_token"
}
```

Validation failures may include details:

```json
{
  "error": "validation_error",
  "details": [
    { "path": ["edition_date"], "message": "Invalid format" }
  ]
}
```

## Common API errors

| Code | Meaning |
|---|---|
| `missing_tenant` | Missing `X-Tenant` header |
| `unknown_tenant` | Tenant slug not found |
| `missing_api_key` | Missing admin key |
| `invalid_api_key` | Key not valid for tenant |
| `missing_bearer_token` | Missing JWT bearer token |
| `invalid_token` | Invalid/expired JWT |
| `tenant_mismatch` | Token tenant does not match request tenant |
| `session_exists` | Attempt to create duplicate session |
| `edition_exists` | Duplicate `(game, edition_date)` publish attempt |

## HTTP status guidance

- `400`: malformed request preconditions
- `401`: missing/invalid authentication
- `403`: authenticated but unauthorized for tenant/object
- `404`: resource not found in tenant scope
- `409`: conflict with uniqueness/idempotency constraints
- `422`: semantic validation failure
- `429`: rate limiting
