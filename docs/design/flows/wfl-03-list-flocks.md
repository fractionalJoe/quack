# List flocks

FR-03, WFL-03. A duck lists the flocks they belong to.

Route: `GET /flocks`, flocks service. Response 200 `[{ flockId, name, ownerId }]`.

```mermaid
---
config:
  theme: forest
---
sequenceDiagram
    autonumber
    participant B as Browser
    participant F as flocks service
    participant DB as Aurora
    B->>F: GET /flocks, bearer token
    F->>F: verify token, resolve caller
    F->>DB: AP-07 memberships WHERE duck_id = caller, joined to flocks
    DB-->>F: flocks
    F-->>B: 200 flocks
```

Authorization: a verified token. The query is keyed on the caller, and the flocks SELECT policy returns only flocks the caller is a member of.

Refusals: 401 only. An empty list is 200.
