---
Status: Accepted
Created: 2026-09-12
Decided: 2026-09-12
Contributors: Joe Martin, Claude
Decision Maker: Joe Martin
Superseded By:
Related ADRs: adr-006-token-verification.md
---

# ADR-010: Identity provider

## Question Under Consideration

Who proves a user's identity? Every request and every socket must carry a verified identity (NFR-05), no credentials may be stored (NFR-07), and one person builds the service with one weekend as the initial estimate (CON-01, CON-02). The Design Brief lists the provider as the one external dependency (DEP-01).

## Decision

Google is the identity provider. The web client obtains an OpenID Connect ID token from Google Sign-In and presents it as a bearer token; the service verifies it in code (ADR-006). The only identity data held is the token's subject and name claim (data-model.md, ducks). No other sign-in path exists.

## Rationale

CON-05 excludes hosted user pools and names Google OpenID Connect. Every prospective user has a Google account (ASM-01), and a provider-issued token means the service stores no credential (NFR-07). The dependency is one-way: Google issues tokens and publishes keys; nothing calls back.

## Options

Criteria are scored 1 to 5 for this context: 1 is highly unfavorable, 3 is neutral, 5 is highly beneficial.

| Option                         | Credentials stored | Time to deliver | Constraint fit | Provider lock-in | Total |
| ------------------------------ | ------------------ | --------------- | -------------- | ---------------- | ----- |
| Google Sign-In, OpenID Connect | 5                  | 5               | 5              | 2                | 17    |
| Cognito user pool              | 5                  | 3               | 1              | 2                | 11    |
| Own username and password      | 1                  | 2               | 1              | 5                | 9     |

### Option 1 - Google Sign-In, OpenID Connect

The browser loads Google's sign-in library and receives an ID token, a JWT signed by Google ([OpenID Connect on Google](https://developers.google.com/identity/openid-connect/openid-connect)). The service verifies signature, issuer, audience, and expiry against Google's published keys. One OAuth client ID to configure, no user store to run.

### Option 2 - Cognito user pool

A hosted pool federating to Google, issuing its own tokens. Adds a pool, a hosted UI or SDK, and a second issuer. Excluded by CON-05.

### Option 3 - Own username and password

A credential table, hashing, reset flows, and rate limiting. Stores credentials, against NFR-07, and costs most of the estimated time.

## Consequences

The client depends on Google's sign-in library and the service on Google's key endpoint. When Google Sign-In is down, new sign-ins fail and sessions with a valid token continue until it expires (DEP-01). Display names are Google's and are not unique there (data-model.md, ducks). The subject claim is the only provider-specific column, so a second provider is one column and one verifier.

## Revisit When

Users without a Google account appear (ASM-01 fails): add a second OpenID Connect provider behind the same verifier. Google publishes rate limits or an SLA change that affects sign-in.
