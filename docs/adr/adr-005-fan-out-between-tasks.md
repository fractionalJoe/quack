---
Status: Accepted
Created: 2026-09-12
Decided: 2026-09-12
Contributors: Joe Martin, Claude
Decision Maker: Joe Martin
Superseded By:
Related ADRs: adr-002-compute.md, adr-004-http-entry-point.md
---

# ADR-005: Fan-out between tasks

## Question Under Consideration

A member's WebSocket lands on one ECS task, chosen by the load balancer. A message sent to a flock arrives on the sender's task, which can push only to the recipients it holds. How does the message reach recipients connected to other tasks? The Scale and Estimates sheet projects 8.4 million connections open at peak. At 50,000 sockets per task, an assumption on the Scale and Estimates sheet, that is about 170 tasks, so a flock's members are spread across many tasks. Delivery must arrive in under one second (SC-07).

## Decision

Tasks fan out through Valkey pub/sub on ElastiCache. Pub/sub has named topics; a task subscribes to the topic of each flock that one of its connections belongs to. A send publishes the message once to the flock's topic; every subscribed task pushes it to the recipients it holds.

## Rationale

Pub/sub is the exact shape of the problem: publish once, every interested task receives it, in milliseconds. It is the only option cheap at both ends, about $12 per month for the demo and broker-priced at scale, where per-message services grow with sends times tasks. It is also the least to build: one client, subscribe and publish.

## Options

Criteria are scored 1 to 5 for this context: 1 is highly unfavorable, 3 is neutral, 5 is highly beneficial.

| Option                          | Cost at scale | Cost in demo | Latency | Time to deliver | Moving parts | Total |
| ------------------------------- | ------------- | ------------ | ------- | --------------- | ------------ | ----- |
| Valkey pub/sub on ElastiCache   | 5             | 4            | 5       | 5               | 4            | 23    |
| SNS with one SQS queue per task | 1             | 5            | 4       | 3               | 2            | 15    |
| MSK                             | 4             | 1            | 5       | 2               | 1            | 13    |

### Option 1 - Valkey pub/sub on ElastiCache

Valkey is the open-source fork of Redis created in 2024 after Redis changed its license; it keeps the same commands and works with Redis clients ([valkey.io](https://valkey.io/)). ElastiCache runs it as a managed service. Its pub/sub is a fire-and-forget broadcast: publish a message to a named topic, and every connection subscribed to that topic receives it. One always-on node in the VPC; the smallest is about $9 per month ([calculator estimate 005-A](https://calculator.aws/#/estimate?id=19f99d3acb7d0838d65885c495e2025f09b0cdd6)). At scale, cluster mode shards pub/sub across nodes and cost follows node hours, not messages: three cache.m7g.large nodes, an assumed size, are about $280 per month ([calculator estimate 005-B](https://calculator.aws/#/estimate?id=18dba22635936ab267c5f94fc9b394ece1873667)). Adds a Valkey client as a dependency.

### Option 2 - SNS with one SQS queue per task

SQS delivers each message to one consumer, so each task creates its own queue on start and deletes it on stop, and SNS fans out to all of them. Nothing always-on and about $2 for the demo ([calculator estimate 005-C](https://calculator.aws/#/estimate?id=6b4c7b65fe66d18fb58f348d729b72f9cb9179ac)). At scale every send lands in every task's queue: 5 billion sends per month across 170 queues is about 1 trillion queue requests, about $270,000 per month ([calculator estimate 005-D](https://calculator.aws/#/estimate?id=5f34637607ade568cfeb99e6a063d368be0473fa); the calculator caps the request field just under the full volume, so the published figure is about 3 percent low).

### Option 3 - MSK

Each task is its own Kafka consumer group and reads the whole topic, with no consumer ceiling. Priced per cluster and broker, not per message: MSK Serverless is about $560 per month for the demo ([calculator estimate 005-E](https://calculator.aws/#/estimate?id=85f41d31b11fbf47c2f2903b2ca3b79af73739d6)), and three provisioned kafka.m7g.large brokers with 1 TB of storage each, an assumed size, are about $750 per month at scale ([calculator estimate 005-F](https://calculator.aws/#/estimate?id=8f8e91b8d3dfc41dc43423cd3132b83567364b3f)). Adds a Kafka client dependency plus consumer groups, partitions, and offsets to build and explain.

### Other options considered

- Kinesis Data Streams: a stream has a ceiling of 20 registered consumers, 50 in On-demand Advantage mode, and shared readers split 5 reads per second per shard ([Kinesis quotas](https://docs.aws.amazon.com/streams/latest/dev/service-sizes-and-limits.html)). 170 tasks cannot read one stream without a relay tier.
- EventBridge: it can call the load balancer, but the load balancer forwards each call to one task, and broadcast needs every task. Per-task routing runs into 300 invocations per second per API destination, 5 targets per rule, and 300 rules per bus ([EventBridge quotas](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-quota.html)).
- Single task, no fan-out: 8.4 million connections at peak need many tasks, so a design with no fan-out does not meet NFR-04.

## Consequences

The VPC gains an ElastiCache node and a security group rule from the tasks. Pub/sub is fire-and-forget: a task that is down or between reconnects misses messages published in that window, and clients recover by reloading history on reconnect. Every task holds a subscription for each flock with a connected member, so subscription churn follows connect and disconnect.

## Revisit When

A single node's publish throughput is reached: move to cluster mode with sharded pub/sub. Missed messages during task restarts become unacceptable: move to Valkey streams or MSK for replay.
