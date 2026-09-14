---
Status: Accepted
Created: 2026-09-12
Decided: 2026-09-12
Contributors: Joe Martin, Claude
Decision Maker: Joe Martin
Superseded By:
Related ADRs: adr-003-capacity-provider.md, adr-007-stack-layout.md
---

# ADR-002: Compute

## Question Under Consideration

What runs the service code? The service serves an HTTP API and holds long-lived WebSocket connections for live delivery. The Scale and Estimates sheet projects 21.6 billion HTTP requests, 50.4 billion live deliveries, and 194 billion connection minutes per month at Slack scale, with 4.5 million connections open on average. The demo runs one month at near-zero load. One person builds and runs it (CON-02); the initial estimate is one weekend (CON-01).

## Decision

All service code runs as Node services on ECS.

## Rationale

At projected scale the managed WebSocket services are billed per message and per connection minute, which makes them the dominant cost. A process that holds its own sockets removes that line. Once ECS runs for sockets, serving HTTP from ECS services costs far less than Lambda plus API Gateway and adds no second runtime.

## Options

Criteria are scored 1 to 5 for this context: 1 is highly unfavorable, 3 is neutral, 5 is highly beneficial.

| Option                              | Cost at scale | Cost in demo | Time to deliver | Operational burden | Real-time fit | Total |
| ----------------------------------- | ------------- | ------------ | --------------- | ------------------ | ------------- | ----- |
| Lambda with API Gateway             | 1             | 5            | 5               | 5                  | 2             | 18    |
| ECS                                 | 5             | 3            | 3               | 3                  | 5             | 19    |
| Lambda for HTTP, ECS for WebSockets | 3             | 4            | 2               | 2                  | 5             | 16    |

### Option 1 - Lambda with API Gateway

HTTP on API Gateway HTTP API, live delivery on API Gateway WebSocket API, handlers on Lambda. No VPC, no load balancer, and the demo month rounds to zero. At scale the estimate is about $139,000 per month: $50,000 for HTTP on API Gateway and Lambda, $89,000 for WebSocket messages and connection minutes ([calculator estimate 002-A](https://calculator.aws/#/estimate?id=6763cfc2fcfc998e0cda2dc71b7446badcd5c624)). WebSocket connections are capped at 2 hours and new connections default to 500 per second per account ([WebSocket API quotas](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-execution-service-websocket-limits-table.html)), against an estimated 2,500 new connections per second at peak (AP-14).

### Option 2 - ECS

Node services behind an Application Load Balancer serve HTTP and hold WebSockets. Estimate at scale is about $16,000 per month on Fargate, of which about $8,800 is the load balancer's active-connection charge ([calculator estimate 002-B](https://calculator.aws/#/estimate?id=1ff51cc98a2d78e3b8f032f7dd952049768422ff)) plus a pub/sub hop so a message reaches recipients on other tasks. Needs a VPC, load balancer, task definition, scaling policy, and token verification in code. Demo month is about $25 before NAT.

### Option 3 - Lambda for HTTP, ECS for WebSockets

Captures the WebSocket saving but keeps the Lambda HTTP cost, about $65,000 per month at scale ([calculator estimate 002-C](https://calculator.aws/#/estimate?id=bee96b9ba26e4348444c1382b3c89e11910ed172)), and carries two runtimes, two deploy paths, and the ECS infrastructure anyway.

## Consequences

The service needs a VPC, an Application Load Balancer, and a pub/sub mechanism between tasks. Google ID token verification is written in code. The demo has an always-on minimum cost. Each service scales by its own task count, against CPU for HTTP services and connection count for the WebSocket service.

## Revisit When

Projected load falls far enough below the estimate that per-request billing beats always-on tasks. The pub/sub hop becomes the bottleneck. Cold-start tolerance or scale-to-zero becomes a requirement. The TypeScript constraint (CON-04) is lifted: consider Rust for the WebSocket service, which holds more connections per vCPU in less memory than Node.
