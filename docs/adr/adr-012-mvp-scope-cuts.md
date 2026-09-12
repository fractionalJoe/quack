---
Status: Accepted
Created: 2026-09-12
Decided: 2026-09-12
Contributors: Joe Martin, Claude
Decision Maker: Joe Martin
Superseded By:
Related ADRs: adr-004-http-entry-point.md, adr-005-fan-out-between-tasks.md, adr-009-data-store.md, adr-010-identity-provider.md
---
# ADR-012: MVP scope cuts

## Question Under Consideration
Which chat features are left out of the MVP, and what does the design already hold for each so that adding it later is additive? The Design Brief lists the cuts (OOS-01 to OOS-11); the timebox is one weekend (CON-01) and the purpose is to demonstrate real-time messaging with server-side authorization.

## Decision
The items in the table are out of scope for the MVP. Each row names what the MVP design already provides for it and what adding it changes.

| Item | Cut | What adding it changes | Revisit when |
| --- | --- | --- | --- |
| OOS-01 | Presence | The websocket service publishes connect and disconnect events to a per-pond topic; online state per duck lives in Valkey with an expiry; clients subscribe through the per-duck control topic named in flows/README.md, Live delivery. Nothing stored in Aurora. | After MVP |
| OOS-02 | Typing indicators | A client-to-server socket message type relayed to the flock topic and never stored. Needs the socket to accept messages other than ping. | After MVP |
| OOS-03 | Read state | A last_read message_id column on memberships and an UPDATE policy for the member's own row (FC-02). One route on the flocks service. | After MVP |
| OOS-04 | Search | A full-text index on messages.body in Postgres, or OpenSearch fed from the change stream (FC-06). A search route on the messages service scoped by membership through the existing SELECT policy. | After MVP |
| OOS-05 | File sharing | An S3 bucket with presigned uploads, an attachments table owned by the messages domain, and a size rule replacing ASM-03 for attachments. NFR-10 still holds because the object is in S3, not the row. | After MVP |
| OOS-06 | Notifications | Depends on presence to know who is offline. An SNS or SES send from the messages service after publish, and a per-duck preference column. | After presence |
| OOS-07 | Threads | A parent_message_id column on messages and a thread history route. Fan-out is unchanged; the client groups by parent. | After MVP |
| OOS-08 | Message editing | An edited_at column, an UPDATE policy on messages for the sender only, and an edited event on the flock topic so open clients replace the body. | After MVP |
| OOS-09 | Multiple ponds | Every row carries pond_id and row-level security scopes every query to it (ADR-009). The pond ID moves from configuration to the request context (architecture.md, Ponds; FC-01). | 12 to 24 months (FC-01) |
| OOS-10 | Resilience and recovery | An Aurora reader in a second Availability Zone, Valkey replication, a second region with Aurora Global Database (ADR-009, FC-03), and a change stream to S3 for replay (FC-06). No failover exists in the MVP. | The demo outlives one month, or the RPO must hold for operator error (FC-06) |
| OOS-11 | Security and compliance | An audit table written by the ducks and flocks services for sign-in, flock create and delete, and member add; an admin role; deletion paths for GDPR and CCPA; WAF rate-based rules on the load balancer (ADR-004). Request logs (NFR-09) are the MVP's only record. | After MVP |
| CON-05 | Hosted user pools | Excluded by constraint; the option is scored in ADR-010. | Users without a Google account appear (ADR-010) |

## Rationale
None of the items is needed to show a message travelling from one browser to another through server-side authorization, and each would cost hours the timebox does not have. The cuts are safe because the data model and the fan-out topic already carry what each needs: a column, a policy, a route, or a socket event, with no rewrite of keys or flows.

## Consequences
The MVP has no admin role, no audit trail beyond request logs, no failover, and no way to know who is online. Each feature is a small addition to one domain, listed in the table, and the flows/README.md note on control events is the one shared prerequisite for presence, membership changes, and flock deletion reaching open sockets.

## Revisit When
The demo becomes a product: OOS-10 and OOS-11 come first, then the features in the order product decides.
