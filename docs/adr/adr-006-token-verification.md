---
Status: Proposed
Created: 2026-09-12
Decided: 2026-09-12
Contributors: Joe Martin, Claude
Decision Maker: Joe Martin
Superseded By:
Related ADRs: adr-004-http-entry-point.md
---
# ADR-006: ID token verification

## Question Under Consideration
Every HTTP request and every WebSocket connection must prove who the user is (NFR-05). The proof is an OpenID Connect ID token, a JWT the browser obtains from the identity provider, Google under CON-05. Where is it verified? Verification means checking the signature against the provider's published keys, the issuer, the expiry, and that the audience is this service's client ID ([OpenID Connect Core, ID token validation](https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation)). The Application Load Balancer (ADR-004) can verify JWTs on HTTP requests, but a browser cannot send an Authorization header on a WebSocket upgrade, so the socket path needs verification in the service regardless.

## Decision
The service verifies ID tokens in code, for HTTP requests and WebSocket connections alike, through one module. The module fetches the provider's public keys, caches them for the period the provider's response allows, and checks signature, issuer, expiry, and audience. The load balancer does no token verification.

## Rationale
The socket path needs the module either way, so a load balancer rule saves no code and adds a second copy of issuer and audience to keep in step. One path means one set of negative tests in Phase 3 and one place for key rotation handling (RSK-02). The per-request cost is a signature check against a cached key.

## Options
Criteria are scored 1 to 5 for this context: 1 is highly unfavorable, 3 is neutral, 5 is highly beneficial.

| Option                                | Places to configure | Code to write | Test surface | Per-request cost | Total |
| ------------------------------------- | ------------------- | ------------- | ------------ | ---------------- | ----- |
| In code for HTTP and WebSockets       | 5                   | 4             | 5            | 3                | 17    |
| ALB rule for HTTP, code for WebSockets | 2                  | 5             | 2            | 5                | 14    |

### Option 1 - In code for HTTP and WebSockets
One verification module, called by the HTTP middleware and by the socket open handler, each reading the token from where its path carries it. Issuer and audience live in one configuration value. Every HTTP request performs a signature check in the service.

### Option 2 - ALB rule for HTTP, code for WebSockets
The HTTPS listener rule rejects invalid tokens before they reach a task ([Verify JWTs using an ALB](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/listener-verify-jwt.html)) and the service trusts the forwarded token on HTTP. The same module still verifies sockets. Issuer and audience are set in CDK and in the service, and each door is tested separately.

### Other options considered
- A hosted user pool such as Cognito: excluded by CON-05.

## Consequences
The service holds an in-memory cache of the provider's keys and refreshes it on expiry or on an unknown key ID. Sign-in failures at the provider leave verified sessions working until the token expires (Design Brief DEP-01).

## Revisit When
Bad traffic reaching tasks becomes a cost or a load problem: add the ALB JWT rule on the HTTP path as a first filter while keeping the code path authoritative.
