# Create flock

FR-02, WFL-02. A signed-in duck creates a named flock and becomes its owner and first member.

Route: `POST /ponds/{pondId}/flocks`, flocks service. Body `{ name }`. Response 201 `{ flockId, name, ownerId }`.

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
    B->>F: POST /ponds/{pondId}/flocks { name }, bearer token
    F->>F: verify token, resolve caller
    F->>F: validate name
    F->>DB: AP-03 insert flock (owner_id = caller), insert membership (duck_id = caller, added_by = caller), one transaction
    DB-->>F: flock
    F-->>B: 201 flock
```

Authorization: a verified token. The flocks INSERT policy requires owner_id to be the caller; the memberships create-flock policy requires the caller to be the flock's owner and the row's duck_id.

Refusals: 400 on an empty name; 409 when the name exists in the pond.
