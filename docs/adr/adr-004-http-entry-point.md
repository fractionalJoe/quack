---
Status: Proposed
Created: 2026-09-12
Decided: 2026-09-12
Contributors: Joe Martin, Claude
Decision Maker: Joe Martin
Superseded By:
Related ADRs: adr-001-hostnames-and-dns.md, adr-002-compute.md
---
# ADR-004: HTTP and WebSocket entry point

## Question Under Consideration
ADR-002 puts the service on ECS. What sits between the internet and the tasks for the HTTP API and for WebSocket connections? The Scale and Estimates sheet projects 21.6 billion HTTP requests per month at 12 KB average response, 4.5 million WebSocket connections open on average, and 1,700 new connections per second at steady state (AP-14). Google ID tokens must be verified on every request (NFR-06).

## Decision
One internet-facing Application Load Balancer on api.quack.ryt.dev serves both the HTTP API and WebSocket connections, forwarding to the ECS service. No API Gateway.

## Rationale
API Gateway's per-request price is the largest line in the estimate and buys an authorizer and CORS that the load balancer can also provide. A second load balancer for sockets adds a hostname, a certificate, and a stack for a saving that only appears when TLS moves into the task.

## Options
Criteria are scored 1 to 5 for this context: 1 is highly unfavorable, 3 is neutral, 5 is highly beneficial.

| Option                                          | Cost at scale | Cost in demo | Time to deliver | Moving parts | Built-in auth and CORS | Total |
| ----------------------------------------------- | ------------- | ------------ | --------------- | ------------ | ---------------------- | ----- |
| ALB for HTTP and WebSockets                     | 4             | 4            | 5               | 5            | 5                      | 23    |
| API Gateway HTTP API and VPC Link, ALB for WebSockets | 1        | 4            | 3               | 2            | 5                      | 15    |
| ALB for HTTP, NLB for WebSockets                | 5             | 3            | 3               | 3            | 4                      | 18    |

### Option 1 - ALB for HTTP and WebSockets
One load balancer with native WebSocket support ([Listeners](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-listeners.html)) and a JWT verification rule that checks signature, issuer, expiry, and audience against Google's JWKS ([Verify JWTs](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/listener-verify-jwt.html)). An ALB bills the largest of its four capacity dimensions each hour. At scale that is 4.5 million active connections at 3,000 per LCU-hour, about $8,800 per month; the HTTP traffic alone, 276 GB per hour at 1 GB per LCU-hour, would be about $1,600 ([ELB pricing](https://aws.amazon.com/elasticloadbalancing/pricing/)). Demo about $16 per month. Calculator estimate: TBD.

### Option 2 - API Gateway HTTP API and VPC Link, ALB for WebSockets
HTTP API in front of an internal ALB through a VPC Link; the JWT authorizer and CORS come from API Gateway. Adds about $19,500 per month at scale at $1.00 per million requests for the first 300 million and $0.90 after ([API Gateway pricing](https://aws.amazon.com/api-gateway/pricing/)), on top of the ALB, which still bills on active connections. Two hops and two places to configure routes. Calculator estimate: TBD.

### Option 3 - ALB for HTTP, NLB for WebSockets
A Network Load Balancer with a TCP listener passes TLS through to the task and meters 100,000 active connections per NLCU-hour, about $200 per month at scale for the socket path, with the ALB dropping to about $1,600 on HTTP bytes alone. With TLS terminated on the NLB the dimension is 3,000 active flows, the same as ALB, and the saving disappears ([ELB pricing](https://aws.amazon.com/elasticloadbalancing/pricing/)). Passthrough puts certificate issuance and renewal inside the container. Adds a second hostname and certificate under ADR-001. Calculator estimate: TBD.

## Consequences
- Throttling: none in the MVP. AWS WAF rate-based rules on the ALB are the recommended addition after MVP.
- Idle timeout: the ALB closes any connection idle for 60 seconds by default; the range is 1 to 4000 seconds ([Connection idle timeout](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/edit-load-balancer-attributes.html#connection-idle-timeout)). A quiet WebSocket is idle, so the client sends a ping inside the window, the timeout is raised, or both.

## Revisit When
Connection count makes the ALB active-connection charge material: move the socket path to an NLB with TLS in the task. Abuse or cost spikes appear: add WAF. A second region needs global routing (FC-03).
