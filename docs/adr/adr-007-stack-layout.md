---
Status: Accepted
Created: 2026-09-12
Decided: 2026-09-12
Contributors: Joe Martin, Claude
Decision Maker: Joe Martin
Superseded By:
Related ADRs: adr-002-compute.md, adr-004-http-entry-point.md, adr-005-fan-out-between-tasks.md
---
# ADR-007: Repository and stack layout

## Question Under Consideration
How is the code organised and how many CDK stacks deploy it? The system has a network, shared data stores, an ECS cluster with a load balancer, a static web client, three HTTP domains (ducks, flocks, messages), and a WebSocket service. One person builds and runs it in one weekend (CON-01, CON-02), and the repo is meant to be read as a demonstration of the architecture.

## Decision
One repository. Each deployable is its own project with its own CDK stack: network, one stack per shared data store, cluster (ECS cluster, Application Load Balancer, listener, certificate), static web client, one stack per HTTP domain (ducks, flocks, messages), and the WebSocket service. Shared code lives in a workspace package. Stacks share values through environment variables or SSM parameters, chosen case by case; CloudFormation exports are not used. Independent stacks deploy in parallel.

## Rationale
One stack per lifecycle keeps a service change from redeploying the network or a data store, and one service per domain makes the ownership of each entity visible in the repo. Parallel jobs keep the wall-clock cost near a single service. CloudFormation exports lock a value while any stack imports it, which turns a routine change to the cluster or listener into a multi-step migration; parameters and environment variables do not.

## Options
Criteria are scored 1 to 5 for this context: 1 is highly unfavorable, 3 is neutral, 5 is highly beneficial.

| Option                                          | Time to deliver | Deploy blast radius | Ownership clarity | Demo cost | Total |
| ----------------------------------------------- | --------------- | ------------------- | ----------------- | --------- | ----- |
| One stack                                       | 5               | 1                   | 2                 | 5         | 13    |
| Stack per lifecycle, one HTTP service           | 4               | 4                   | 3                 | 4         | 15    |
| Stack per lifecycle, one service per domain     | 3               | 5                   | 5                 | 3         | 16    |

### Option 1 - One stack
Everything in one deploy. Fastest to write; any change redeploys all of it, and a failed service deploy rolls back the network with it.

### Option 2 - Stack per lifecycle, one HTTP service
Network, data stores, cluster, web client, one HTTP service, and the WebSocket service as separate stacks. The domains live in one process and one task definition, so entity ownership is a matter of folder discipline rather than deploy boundaries.

### Option 3 - Stack per lifecycle, one service per domain
As option 2 with ducks, flocks, and messages as separate ECS services, target groups, and listener rules. About an hour more scaffolding than option 2 with a shared construct, four log groups to read instead of two, and an always-on task per service in the demo. A membership check on send crosses a domain boundary, so the internal call path between services is a design item.

## Consequences
The repo carries a workspace with a shared package and one project per stack. The GitHub Actions workflow deploys each stack as its own job, ordered by dependency; independent jobs run in parallel. Each service has its own scaling policy, log group, and task role. Configuration flows through environment variables set by CDK and SSM parameters read at start; a value's source is stated where it is consumed. The messages service must either call the flocks service or read membership records under a stated rule; that rule is recorded in the architecture doc.

## Revisit When
A domain needs a different runtime (ADR-002 names Rust for the WebSocket service): it changes alone. Deploy count or cost makes separate services a burden at demo scale: fold the HTTP domains into one service without changing stack boundaries.
