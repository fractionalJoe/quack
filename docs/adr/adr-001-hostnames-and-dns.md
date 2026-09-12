---
Status: Accepted
Created: 2026-09-12
Decided: 2026-09-12
Contributors: Joe Martin, Claude
Decision Maker: Joe Martin
Superseded By:
Related ADRs:
---

# ADR-001: Public hostnames and DNS

## Question Under Consideration

The service exposes public endpoints: the web client and the API. What hostnames do they serve on, and which DNS provider holds the records? The domain ryt.dev is registered with DNS hosted in Cloudflare. Google Sign-In requires the client's origin to be registered on the OAuth client ahead of time, and Phase 4 destroys and redeploys the stacks, making persistent hostnames beneficial.

## Decision

Every public endpoint serves on a subdomain of quack.ryt.dev: the web client on quack.ryt.dev and the HTTP API on api.quack.ryt.dev. The real-time endpoint's hostname is set with the transport decision. Each record is a DNS-only CNAME in Cloudflare pointing at the AWS endpoint. ACM issues the certificates in the region each service requires, validated by CNAMEs added in Cloudflare. Hostnames are configuration values read by CDK. Route 53 is not used.

## Rationale

Fixed hostnames keep the Google authorized origin and the client's API base URL constant across destroy and redeploy; the CloudFront and API Gateway default hostnames change with every new distribution or API. Cloudflare already holds the zone, so pointing records at AWS adds no service. The cost is a handful of DNS records entered by hand, documented in the README.

## Options

Criteria are scored 1 to 5 for this context: 1 is highly unfavorable, 3 is neutral, 5 is highly beneficial.

| Option                      | Stable endpoints | Demo URLs | Steps outside CDK | Time to deliver | New services | Total |
| --------------------------- | ---------------- | --------- | ----------------- | --------------- | ------------ | ----- |
| No custom domain            | 1                | 2         | 5                 | 5               | 5            | 18    |
| Custom domain in Route 53   | 5                | 5         | 4                 | 3               | 2            | 19    |
| Custom domain in Cloudflare | 5                | 5         | 3                 | 4               | 4            | 21    |

### Option 1 - No custom domain

Endpoints serve on the CloudFront and API Gateway default hostnames. Nothing outside CDK. Hostnames are known only after the first deploy and change on redeploy, so the Google OAuth client origin and the client's API base URL are edited after every clean deploy. Whether Google accepts a cloudfront.net origin was not verified.

### Option 2 - Custom domain in Route 53

quack.ryt.dev is delegated from Cloudflare to a Route 53 hosted zone by one NS record. CDK then creates the certificates, validates them, and writes every record. Adds a hosted zone and Route 53 code.

### Option 3 - Custom domain in Cloudflare

Records stay in the existing Cloudflare zone, DNS-only, pointing at the AWS endpoints. Entered by hand: one ACM validation CNAME per certificate during the first deploy, and one CNAME per endpoint after it. Proxied mode is not used; it would put a second proxy and Cloudflare's TLS in front of AWS for no gain, and would interfere with WebSocket and API traffic.

## Consequences

The README carries the Cloudflare steps and the first deploy waits until each validation record resolves. Hostnames live in configuration, so a reader substitutes their own domain and DNS provider. The Google OAuth client is configured once. No Route 53 resources exist, so nothing in CDK depends on a hosted zone. Each new public endpoint adds a certificate and a record.

## Revisit When

DNS changes must be automated, for example a custom resource calling the Cloudflare API. A second region needs latency or failover routing (FC-03). The zone leaves Cloudflare.
