---
Status: Accepted
Created: 2026-09-12
Decided: 2026-09-12
Contributors: Joe Martin, Claude
Decision Maker: Joe Martin
Superseded By:
Related ADRs: adr-007-stack-layout.md
---

# ADR-008: Cross-domain reads

## Question Under Consideration

Each HTTP domain owns its entities (ADR-007): flocks owns flocks and memberships, messages owns messages, ducks owns ducks. Sending a message requires a membership check, and the messages service does not own memberships. How does one service obtain data another service owns? At peak this happens 3,900 times per second on the send path alone.

## Decision

For the MVP, a service may read records owned by another domain directly from the shared data store, under a stated rule: read only, never write, and the read is named in the architecture doc against the owning domain. No service-to-service calls exist.

## Rationale

This is a time-constrained choice, not the target design. The one-weekend estimate (CON-01) leaves no room for internal service networking, and a direct read is one data store call with no new infrastructure. The target is a call to the owning service over ECS Service Connect, which keeps each domain the only reader and writer of its data. The stated rule limits the debt: every cross-domain read is listed, so replacing them later is a known set of edits.

## Options

Criteria are scored 1 to 5 for this context: 1 is highly unfavorable, 3 is neutral, 5 is highly beneficial.

| Option                                      | Time to deliver | Domain isolation | Send path latency | Moving parts | Total |
| ------------------------------------------- | --------------- | ---------------- | ----------------- | ------------ | ----- |
| Direct read under a stated rule             | 5               | 2                | 5                 | 5            | 17    |
| Call the owning service via Service Connect | 3               | 5                | 3                 | 3            | 14    |

### Option 1 - Direct read under a stated rule

The messages service reads membership records with the shared data access package. One data store call, no new infrastructure. Two domains now depend on the shape of one record, so a change to memberships touches both.

### Option 2 - Call the owning service via ECS Service Connect

A namespace on the cluster and a Service Connect block per service in CDK; a proxy sidecar in each task; calls by service name inside the VPC, trusted by security group ([ECS Service Connect](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service-connect.html)). The send path gains an HTTP hop before its data store call. About an hour of setup and one more concept to explain.

## Consequences

The architecture doc carries a table of cross-domain reads: reading service, owning domain, record, purpose. Any write to another domain's records is a defect. A change to a record read across domains is checked against that table.

## Revisit When

After MVP: replace each listed cross-domain read with a call to the owning service over Service Connect, then remove this rule.
