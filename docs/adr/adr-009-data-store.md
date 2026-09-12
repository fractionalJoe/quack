---
Status: Accepted
Created: 2026-09-12
Decided: 2026-09-12
Contributors: Joe Martin, Claude
Decision Maker: Joe Martin
Superseded By:
Related ADRs: adr-002-compute.md, adr-007-stack-layout.md, adr-008-cross-domain-reads.md
---
# ADR-009: Data store

## Question Under Consideration
What stores ducks, flocks, memberships, and messages? Every read or write of a flock is gated on membership and every delete on ownership (FR-09, NFR-05), every record carries the pond key (NFR-11), and a flock delete removes its memberships and messages with it (FR-08). The Scale and Estimates sheet projects about 25,600 backend reads and 7,800 backend writes per second at peak and about 70 TB stored at the 24 month horizon. A second region is a named future consideration (FC-03). One person builds it in one weekend (CON-01, CON-02) and the demo runs one month at near-zero load.

## Decision
Aurora PostgreSQL Serverless v2 in one region is the data store. One cluster, one database, one table per entity, every table carrying pond_id. Row-level security policies enforce pond isolation and flock membership in the store. After the MVP, a second region is served by Aurora Global Database with each pond homed to one writer region; it is not built now.

## Rationale
Authorization is the product's central requirement, and Postgres row-level security enforces pond and membership rules on every query regardless of which handler issued it. Memberships and cascading flock deletes are relational shapes: a join and a foreign key with ON DELETE CASCADE, against a fan of queries and batched deletes on a key-value store. Familiarity with Postgres makes this the shortest path in the timebox despite more infrastructure. The global path is active-passive with a homed pond, which is acceptable because a home region serializes each flock's writes and keeps message order identical everywhere. At scale the DynamoDB and Aurora estimates are within ten percent of each other, so cost does not decide.

## Options
Criteria are scored 1 to 5 for this context: 1 is highly unfavorable, 3 is neutral, 5 is highly beneficial.

| Option                             | Authorization in the store | Relational fit | Time to deliver | Cost in demo | Global path | Scale headroom | Total |
| ---------------------------------- | -------------------------- | -------------- | --------------- | ------------ | ----------- | -------------- | ----- |
| DynamoDB, one table                | 2                          | 3              | 3               | 5            | 5           | 5              | 23    |
| DynamoDB, one table per domain     | 3                          | 3              | 3               | 5            | 5           | 5              | 24    |
| Aurora PostgreSQL Serverless v2    | 5                          | 5              | 4               | 4            | 3           | 3              | 24    |

### Option 1 - DynamoDB, one table
One table with the pond key leading every partition key, on-demand capacity, one stack. Membership and pond checks are code in the shared package; the store cannot tell one domain's items from another's inside a partition, so write ownership between services is convention. Flock delete is a query followed by batched deletes. Global tables replicate multi-active with last-writer-wins conflict resolution ([Global tables](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GlobalTables.html)). No table size ceiling; items are capped at 400 KB ([DynamoDB quotas](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ServiceQuotas.html#limits-items)), which meets NFR-10. An on-demand table serves up to double its previous peak; a faster ramp is throttled until capacity catches up ([On-demand capacity mode](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/on-demand-capacity-mode.html)). Demo month is about $0.45 ([calculator estimate 009-A](https://calculator.aws/#/estimate?id=71ddba7965b8e0ec84ce654acc466e538b70105c)); at scale about $25,000 per month, two thirds of it storage and point-in-time recovery ([calculator estimate 009-B](https://calculator.aws/#/estimate?id=a36220dfcc4dd49518243a55b6aecc97aa4a1f99)).

### Option 2 - DynamoDB, one table per domain
As option 1 with ducks, flocks, and messages in separate tables and stacks, so each service's task role is granted write on its own table only. Cross-domain reads under ADR-008 are read grants on the other tables. Three stacks and three sets of key design instead of one. Priced as option 1.

### Option 3 - Aurora PostgreSQL Serverless v2
One cluster in the existing VPC, one table per entity, foreign keys with ON DELETE CASCADE for flock delete, row-level security keyed on pond_id and on a membership subquery ([Row security policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)). Each service connects as its own database role with grants on its own tables, so write ownership is enforced by the store. A text column holds up to about 1 GB ([Character types](https://www.postgresql.org/docs/current/datatype-character.html)), which meets NFR-10. Capacity scales in ACUs from a minimum of 0.5 when running and pauses to 0 when idle ([Serverless v2 capacity](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.setting-capacity.html)) at $0.12 per ACU-hour in us-east-1 ([Aurora pricing](https://aws.amazon.com/rds/aurora/pricing/)), so a demo that never pauses is about $44 per month plus storage ([calculator estimate 009-C](https://calculator.aws/#/estimate?id=4ca6e88e0374c1739610b306b18d4cb0b3122133); the calculator accepts whole ACUs only, so the saved estimate shows 1 ACU at about $88). At scale, three db.r7g.8xlarge instances, an assumed size, with I/O-Optimized storage, RDS Proxy, Database Insights, and 7 days of backups are about $23,000 per month ([calculator estimate 009-E](https://calculator.aws/#/estimate?id=d6aed5bab9a00ae8d9e064cfc667c5e9c2448fff)). The same fleet on Aurora Standard storage without proxy or insights is about $13,000 but bills every disk read, and the Scale sheet's hot data share is about 3.5 TB against 256 GiB of instance cache ([calculator estimate 009-D](https://calculator.aws/#/estimate?id=2c587e28a9bf3029de13fc09306a09868d0d6d66)). A cluster volume grows to 128 TiB ([Aurora storage](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.Overview.StorageReliability.html)), which holds the 24 month volume with room to about four years before ponds must be split across clusters. Writes go through one writer instance, scaled vertically. Aurora Global Database adds read-only secondary regions with storage-level replication and promotes one on failover ([Aurora Global Database](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database.html)); writes from other regions travel to the primary.

## Consequences
The data store stack creates the cluster, a subnet group in the private subnets, and a security group that admits the service tasks. A schema file and a migration step exist from the first deploy. Each service has a database role and connects with IAM database authentication: the task role signs a short-lived token and the connection uses TLS, so no database password exists ([IAM database authentication](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/UsingWithRDS.IAMDBAuth.html)). The shared package owns the connection pool and sets the pond and caller for row-level security on every transaction. Cross-domain reads under ADR-008 are read grants on another domain's tables. A change stream for FC-06 is available through logical replication. The second region is a second cluster and a runbook for promotion; a pond's writes always go to its home region. At scale an RDS Proxy pools connections in front of the writer; the proxy authenticates to the database with a Secrets Manager secret, so the no-password property then holds for the services only.

## Revisit When
Write volume approaches one writer instance's ceiling: shard ponds across clusters. Stored volume approaches the cluster limit: the same split. Writes from every region must be local: reconsider a multi-active store for the message table alone.
